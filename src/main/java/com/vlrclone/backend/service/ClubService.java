//package com.vlrclone.backend.service;
//
//import com.vlrclone.backend.model.ClubMember;
//import com.vlrclone.backend.model.User;
//import com.vlrclone.backend.repository.ClubMemberRepository;
//import com.vlrclone.backend.repository.ClubRepository;
//import com.vlrclone.backend.repository.UserRepository;
//import jakarta.transaction.Transactional;
//import org.springframework.stereotype.Service;
//
//import java.util.List;
//import java.util.Optional;
//
//@Service
//@Transactional
//public class ClubService {
//    private final ClubRepository clubRepo;
//    private final ClubMemberRepository cmRepo;
//    private final UserRepository userRepo;
//
//    public ClubService(ClubRepository clubRepo, ClubMemberRepository cmRepo, UserRepository userRepo) {
//        this.clubRepo = clubRepo; this.cmRepo = cmRepo; this.userRepo = userRepo;
//    }
//
//    /* ---- helpers ---- */
//
//    private boolean isSiteAdmin(User requester) {
//        return requester.getRole() == User.Role.ADMIN; // or however you store site roles
//    }
//
//    private ClubMember getMembershipOrThrow(Long clubId, Long userId) {
//        return cmRepo.findByClubIdAndUserId(clubId, userId)
//                .orElseThrow(() -> new NotFoundException("Membership not found"));
//    }
//
//    private Optional<ClubMember> getRequestersClubMembership(Long clubId, Long requesterId) {
//        return cmRepo.findByClubIdAndUserId(clubId, requesterId);
//    }
//
//    /* ---- business rules ---- */
//
//    public void adminSetLeader(Long clubId, Long targetUserId, Long requesterId) {
//        User requester = userRepo.getReferenceById(requesterId);
//        if (!isSiteAdmin(requester)) throw new ForbiddenException("Admin only");
//
//        // demote everyone else to MEMBER, set target to LEADER (single leader)
//        List<ClubMember> all = cmRepo.findByClubId(clubId);
//        for (ClubMember cm : all) {
//            if (cm.getUser().getId().equals(targetUserId)) {
//                cm.setRole(ClubMember.Role.LEADER);
//            } else {
//                cm.setRole(ClubMember.Role.MEMBER);
//            }
//        }
//        cmRepo.saveAll(all);
//    }
//
//    public void promoteToCoLeader(Long clubId, Long targetUserId, Long requesterId) {
//        User requester = userRepo.getReferenceById(requesterId);
//        boolean allowed = isSiteAdmin(requester) ||
//                getRequestersClubMembership(clubId, requesterId)
//                        .map(cm -> cm.getRole() == ClubMember.Role.LEADER)
//                        .orElse(false);
//        if (!allowed) throw new ForbiddenException("Leader or Admin only");
//
//        ClubMember target = getMembershipOrThrow(clubId, targetUserId);
//        target.setRole(ClubMember.Role.CO_LEADER);
//        cmRepo.save(target);
//    }
//
//    public void demoteToMember(Long clubId, Long targetUserId, Long requesterId) {
//        User requester = userRepo.getReferenceById(requesterId);
//
//        // Admin: can demote CO_LEADER to MEMBER (and also members are already member)
//        // Leader: can demote CO_LEADER to MEMBER
//        // No one can demote the LEADER here (only adminSetLeader changes leader)
//        ClubMember target = getMembershipOrThrow(clubId, targetUserId);
//
//        boolean requesterIsLeader = getRequestersClubMembership(clubId, requesterId)
//                .map(cm -> cm.getRole() == ClubMember.Role.LEADER).orElse(false);
//
//        boolean allowed =
//                isSiteAdmin(requester) && target.getRole() == ClubMember.Role.CO_LEADER
//                        || requesterIsLeader && target.getRole() == ClubMember.Role.CO_LEADER;
//
//        if (!allowed) throw new ForbiddenException("Cannot demote this user");
//
//        target.setRole(ClubMember.Role.MEMBER);
//        cmRepo.save(target);
//    }
//
//    public void kick(Long clubId, Long targetUserId, Long requesterId) {
//        User requester = userRepo.getReferenceById(requesterId);
//        ClubMember target = getMembershipOrThrow(clubId, targetUserId);
//
//        ClubMember.Role targetRole = target.getRole();
//        Optional<ClubMember> reqMem = getRequestersClubMembership(clubId, requesterId);
//        boolean requesterIsLeader = reqMem.map(m -> m.getRole() == ClubMember.Role.LEADER).orElse(false);
//        boolean requesterIsCoLeader = reqMem.map(m -> m.getRole() == ClubMember.Role.CO_LEADER).orElse(false);
//
//        boolean allowed =
//                isSiteAdmin(requester)                                        // admin can kick anyone
//                        || (requesterIsLeader && targetRole != ClubMember.Role.LEADER)          // leader can kick co-leaders & members
//                        || (requesterIsCoLeader && targetRole == ClubMember.Role.MEMBER);       // co-leader can kick members only
//
//        if (!allowed) throw new ForbiddenException("Not allowed to kick this user");
//
//        cmRepo.delete(target);
//    }
//
//    /* ---- news permissions ---- */
//
//    public boolean canPostNews(Long clubId, Long requesterId) {
//        User requester = userRepo.getReferenceById(requesterId);
//        if (isSiteAdmin(requester)) return true;
//        return getRequestersClubMembership(clubId, requesterId)
//                .map(m -> m.getRole() == ClubMember.Role.LEADER || m.getRole() == ClubMember.Role.CO_LEADER)
//                .orElse(false);
//    }
//
//    public boolean canModerateJoinRequests(Long clubId, Long requesterId) {
//        User requester = userRepo.getReferenceById(requesterId);
//        if (isSiteAdmin(requester)) return true;
//        return getRequestersClubMembership(clubId, requesterId)
//                .map(m -> m.getRole() == ClubMember.Role.LEADER)
//                .orElse(false);
//    }
//}
