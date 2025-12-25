package com.vlrclone.backend.service;

import com.vlrclone.backend.dto.PostFeedDto;
import com.vlrclone.backend.model.Post;
import com.vlrclone.backend.model.PostImage;
import com.vlrclone.backend.model.PostLike;
import com.vlrclone.backend.repository.CommentRepository;
import com.vlrclone.backend.repository.PostLikeRepository;
import com.vlrclone.backend.repository.PostRepository;
import org.springframework.stereotype.Service;

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


    public List<PostFeedDto> getFeed(String username) {
        return posts.findAllByOrderByCreatedAtDesc().stream()
                .map(p -> new PostFeedDto(
                        p.getId(),
                        p.getAuthor(),
                        p.getContent(),
                        p.getImages()
                                .stream()
                                .map(PostImage::getUrl)
                                .toList(),
                        p.getCreatedAt(),
                        likes.countByPostId(p.getId()),
                        username != null && likes.existsByPostIdAndUsername(p.getId(), username),
                        comments.countByPostIdAndParentIdIsNull(p.getId())
                ))

                .toList();
    }


    public void like(Long postId, String username) {
        if (!likes.existsByPostIdAndUsername(postId, username)) {
            Post post = posts.findById(postId).orElseThrow();
            likes.save(new PostLike(post, username));
        }
    }

    public void unlike(Long postId, String username) {
        likes.deleteByPostIdAndUsername(postId, username);
    }

    // src/main/java/com/vlrclone/backend/service/PostService.java

    public void deletePost(Long postId, String requesterUsername, boolean isAdmin) {
        Post post = posts.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!isAdmin && !post.getAuthor().equals(requesterUsername)) {
            throw new RuntimeException("Not allowed");
        }

        likes.deleteAllByPostId(postId);
        comments.deleteAllByPostId(postId);
        posts.delete(post);
    }

}
