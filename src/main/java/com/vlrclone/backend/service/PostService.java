package com.vlrclone.backend.service;

import com.vlrclone.backend.dto.PostFeedDto;
import com.vlrclone.backend.model.Post;
import com.vlrclone.backend.model.PostImage;
import com.vlrclone.backend.model.PostLike;
import com.vlrclone.backend.repository.CommentRepository;
import com.vlrclone.backend.repository.PostLikeRepository;
import com.vlrclone.backend.repository.PostRepository;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.List;

@Service
public class PostService {

    private final PostRepository posts;
    private final PostLikeRepository likes;
    private final CommentRepository comments;

    public PostService(
            PostRepository posts,
            PostLikeRepository likes,
            CommentRepository comments
    ) {
        this.posts = posts;
        this.likes = likes;
        this.comments = comments;
    }

    /* ===================== FEED ===================== */

    public List<PostFeedDto> getFeed(String username) {
        return posts.findAllByOrderByPinnedDescPinnedAtDescCreatedAtDesc()
                .stream()
                .map(p -> toFeedDto(p, username))
                .toList();
    }

    /* ===================== LIKE ===================== */

    public void like(Long postId, String username) {
        if (!likes.existsByPostIdAndUsername(postId, username)) {
            Post post = posts.findById(postId).orElseThrow();
            likes.save(new PostLike(post, username));
        }
    }

    public void unlike(Long postId, String username) {
        likes.deleteByPostIdAndUsername(postId, username);
    }

    /* ===================== DELETE POST ===================== */

    public void deletePost(Long postId, String requesterUsername, boolean isAdmin) {
        Post post = posts.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!isAdmin && !post.getAuthor().equals(requesterUsername)) {
            throw new RuntimeException("Not allowed");
        }

        post.getImages().forEach(img -> deleteImageFile(img.getUrl()));

        likes.deleteAllByPostId(postId);
        comments.deleteAllByPostId(postId);
        posts.delete(post);
    }

    /* ===================== FILE CLEANUP ===================== */

    public void deleteImageFile(String imageUrl) {
        try {
            if (imageUrl == null || imageUrl.isBlank()) return;

            Path path = Paths.get(imageUrl.substring(1));
            if (Files.exists(path)) {
                Files.delete(path);
            }
        } catch (Exception e) {
            System.err.println("Failed to delete image file: " + imageUrl);
        }
    }

    /* ===================== DTO MAPPER ===================== */

    public PostFeedDto toFeedDto(Post post, String username) {
        return new PostFeedDto(
                post.getId(),
                post.getAuthor(),
                post.getContent(),
                post.getImages()
                        .stream()
                        .sorted(Comparator.comparingInt(PostImage::getPosition))
                        .map(img -> new PostFeedDto.ImageDto(
                                img.getId(),
                                img.getUrl()
                        ))
                        .toList(),
                post.getCreatedAt(),
                likes.countByPostId(post.getId()),
                username != null &&
                        likes.existsByPostIdAndUsername(post.getId(), username),
                comments.countByPostIdAndParentIdIsNull(post.getId()),
                post.isPinned()   // 🔥 THIS IS THE ONLY ADDITION
        );
    }
}
