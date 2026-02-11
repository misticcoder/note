package com.vlrclone.backend.seed;

import com.vlrclone.backend.model.Comment;
import com.vlrclone.backend.model.Post;
import com.vlrclone.backend.repository.CommentRepository;
import com.vlrclone.backend.repository.PostRepository;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Order(11)
@Component
public class CommentSeeder {

    private final CommentRepository commentRepo;
    private final PostRepository postRepo;

    public CommentSeeder(CommentRepository commentRepo, PostRepository postRepo) {
        this.commentRepo = commentRepo;
        this.postRepo = postRepo;
    }

    public void seed() {

        if (commentRepo.count() > 0) return;

        for (Post post : postRepo.findAll()) {

            Comment parent = new Comment();
            parent.setComment("Main comment on post " + post.getId());
            parent.setUsername("student1");
            parent.setPostId(post.getId());
            parent.setCreatedAt(LocalDateTime.now());

            commentRepo.save(parent);

            for (int i = 0; i < 5; i++) {

                Comment reply = new Comment();
                reply.setComment("Reply " + i);
                reply.setUsername("student" + (i + 2));
                reply.setPostId(post.getId());
                reply.setParentId(parent.getParentId());
                reply.setCreatedAt(LocalDateTime.now());

                commentRepo.save(reply);
            }
        }
    }
}

