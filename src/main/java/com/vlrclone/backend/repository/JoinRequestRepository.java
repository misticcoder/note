package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.JoinRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JoinRequestRepository extends JpaRepository<JoinRequest, Long> {
    List<JoinRequest> findByClubIdAndStatus(Long clubId, JoinRequest.Status status);
    Optional<JoinRequest> findByClubIdAndUserId(Long clubId, Long userId);
}
