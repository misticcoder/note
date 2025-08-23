// src/main/java/com/vlrclone/backend/repository/CommentRepository.java
package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByThreadIdOrderByCreatedAtAsc(Long threadId);
}
