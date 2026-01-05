package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.ClubMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClubMemberRepository extends JpaRepository<ClubMember, Long> {
    List<ClubMember> findByClubId(Long clubId);
    Optional<ClubMember> findByClubIdAndUserId(Long clubId, Long userId);
    long countByClubIdAndRole(Long clubId, ClubMember.Role role);
    boolean existsByClubIdAndUserId(Long clubId, Long userId);
    boolean existsByClubIdAndUserIdAndRole(Long clubId, Long userId, ClubMember.Role role);
    List<ClubMember> findByClubIdIn(List<Long> clubIds);
    List<ClubMember> findByUserId(Long userId);

}
