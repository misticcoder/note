package com.vlrclone.backend.service;

import com.vlrclone.backend.dto.PostFeedDto;
import com.vlrclone.backend.model.Post;
import com.vlrclone.backend.model.PostLike;
import com.vlrclone.backend.repository.PostLikeRepository;
import com.vlrclone.backend.repository.PostRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PostService {

    private final PostRepository posts;
    private final PostLikeRepository likes;

    public PostService(PostRepository posts, PostLikeRepository likes) {
        this.posts = posts;
        this.likes = likes;
    }

    public List<PostFeedDto> getFeed(String username) {
        return posts.findAllByOrderByCreatedAtDesc().stream()
                .map(p -> new PostFeedDto(
                        p.getId(),
                        p.getAuthor(),
                        p.getContent(),
                        p.getImageUrl(),
                        p.getCreatedAt(),
                        likes.countByPostId(p.getId()),
                        username != null && likes.existsByPostIdAndUsername(p.getId(), username)
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
}
