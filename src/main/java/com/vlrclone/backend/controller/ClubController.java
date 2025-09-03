// src/main/java/com/vlrclone/backend/controller/ClubController.java
package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.*;
import com.vlrclone.backend.model.ClubMember.Role;
import com.vlrclone.backend.model.JoinRequest.Status;
import com.vlrclone.backend.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/clubs")
public class ClubController {
    private final ClubRepository clubs;
    private final ClubMemberRepository members;
    private final JoinRequestRepository requests;
    private final ClubNewsRepository news;
    private final UserRepository users;

    public ClubController(ClubRepository c, ClubMemberRepository m, JoinRequestRepository r, ClubNewsRepository n, UserRepository u) {
        this.clubs = c;
        this.members = m;
        this.requests = r;
        this.news = n;
        this.users = u;
    }

    /* Utility */
    private Optional<User> byEmail(String email) {
        return users.findByEmail(email);
    }

    private boolean isAdmin(User u) {
        return u.getRole() == com.vlrclone.backend.model.User.Role.ADMIN;
    }

    private boolean isLeader(Long clubId, Long userId) {
        return members.existsByClubIdAndUserIdAndRole(clubId, userId, Role.LEADER);
    }
    private boolean isCoLeader(Long clubId, Long userId) {
        return members.existsByClubIdAndUserIdAndRole(clubId, userId, Role.CO_LEADER);
    }

    /* Public */
    @GetMapping
    public List<Club> listClubs() {
        return clubs.findAll();
    }

    @GetMapping("/{clubId}")
    public ResponseEntity<?> getClub(@PathVariable Long clubId) {
        return clubs.findById(clubId).<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).body(Map.of("message", "Club not found")));
    }

    @GetMapping("/{clubId}/news")
    public List<ClubNews> clubNews(@PathVariable Long clubId) {
        return news.findByClubIdOrderByCreatedAtDesc(clubId);
    }

    @GetMapping("/{clubId}/members")
    public List<ClubMember> clubMembers(@PathVariable Long clubId) {
        return members.findByClubId(clubId);
    }

    /* Admin: create club */
    @PostMapping
    public ResponseEntity<?> createClub(@RequestParam String requesterEmail, @RequestBody Map<String, String> body) {
        var req = byEmail(requesterEmail).orElse(null);
        if (req == null || !isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Admin only"));
        String name = body.getOrDefault("name", "").trim();
        String description = body.getOrDefault("description", "").trim();
        if (name.isBlank() || description.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "name and description required"));
        if (clubs.existsByName(name)) return ResponseEntity.status(409).body(Map.of("message", "name already exists"));
        var c = new Club();
        c.setName(name);
        c.setDescription(description);
        return ResponseEntity.ok(clubs.save(c));
    }

    /* Admin: assign leader */
    @PostMapping("/{clubId}/leader")
    public ResponseEntity<?> assignLeader(@PathVariable Long clubId, @RequestParam String requesterEmail, @RequestBody Map<String, Long> body) {
        var req = byEmail(requesterEmail).orElse(null);
        if (req == null || !isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Admin only"));
        Long userId = body.get("userId");
        if (userId == null) return ResponseEntity.badRequest().body(Map.of("message", "userId required"));
        if (!clubs.existsById(clubId)) return ResponseEntity.status(404).body(Map.of("message", "Club not found"));

        var cm = members.findByClubIdAndUserId(clubId, userId)
                .orElseGet(() -> {
                    var m = new ClubMember();
                    m.setClubId(clubId);
                    m.setUserId(userId);
                    return m;
                });
        cm.setRole(Role.LEADER);
        return ResponseEntity.ok(members.save(cm));
    }

    /* User: request to join */
    @PostMapping("/{clubId}/join")
    public ResponseEntity<?> requestJoin(@PathVariable Long clubId, @RequestParam String requesterEmail) {
        var req = byEmail(requesterEmail).orElse(null);
        if (req == null) return ResponseEntity.status(403).body(Map.of("message", "Login required"));
        if (!clubs.existsById(clubId)) return ResponseEntity.status(404).body(Map.of("message", "Club not found"));

        if (members.existsByClubIdAndUserId(clubId, req.getId()))
            return ResponseEntity.status(409).body(Map.of("message", "Already a member"));
        var jr = requests.findByClubIdAndUserId(clubId, req.getId()).orElseGet(JoinRequest::new);
        jr.setClubId(clubId);
        jr.setUserId(req.getId());
        jr.setStatus(Status.PENDING);
        return ResponseEntity.ok(requests.save(jr));
    }

    /* Leader/Admin: list pending requests */
    @GetMapping("/{clubId}/join-requests")
    public ResponseEntity<?> pending(@PathVariable Long clubId, @RequestParam String requesterEmail) {
        var req = byEmail(requesterEmail).orElse(null);
        if (req == null) return ResponseEntity.status(403).body(Map.of("message", "Login required"));
        boolean allowed = isAdmin(req) || isLeader(clubId, req.getId()) || isCoLeader(clubId, req.getId());
        if (!allowed) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        return ResponseEntity.ok(requests.findByClubIdAndStatus(clubId, Status.PENDING));
    }

    /* Leader/Admin: approve/deny */
    @PostMapping("/{clubId}/join-requests/{requestId}/decision")
    public ResponseEntity<?> decide(@PathVariable Long clubId, @PathVariable Long requestId,
                                    @RequestParam String requesterEmail, @RequestParam String decision) {
        var req = byEmail(requesterEmail).orElse(null);
        if (req == null) return ResponseEntity.status(403).body(Map.of("message", "Login required"));
        boolean allowed = isAdmin(req) || isLeader(clubId, req.getId()) || isCoLeader(clubId, req.getId());
        if (!allowed) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        var jrOpt = requests.findById(requestId);
        if (jrOpt.isEmpty() || !jrOpt.get().getClubId().equals(clubId))
            return ResponseEntity.status(404).body(Map.of("message", "Request not found"));

        var jr = jrOpt.get();
        if ("approve".equalsIgnoreCase(decision)) {
            jr.setStatus(Status.APPROVED);
            // add member if not exists
            members.findByClubIdAndUserId(clubId, jr.getUserId())
                    .orElseGet(() -> {
                        var m = new ClubMember();
                        m.setClubId(clubId);
                        m.setUserId(jr.getUserId());
                        m.setRole(Role.MEMBER);
                        return members.save(m);
                    });
        } else if ("reject".equalsIgnoreCase(decision)) {
            jr.setStatus(Status.REJECTED);
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "decision must be approve or reject"));
        }
        return ResponseEntity.ok(requests.save(jr));
    }

    /* Leader/Admin: post news */
    @PostMapping("/{clubId}/news")
    public ResponseEntity<?> postNews(@PathVariable Long clubId, @RequestParam String requesterEmail, @RequestBody Map<String, String> body) {
        var req = byEmail(requesterEmail).orElse(null);
        if (req == null) return ResponseEntity.status(403).body(Map.of("message", "Login required"));
        boolean allowed = isAdmin(req) || isLeader(clubId, req.getId()) || isCoLeader(clubId, req.getId());
        if (!allowed) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        String title = body.getOrDefault("title", "").trim();
        String content = body.getOrDefault("content", "").trim();
        if (title.isBlank() || content.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "title and content required"));

        var n = new ClubNews();
        n.setClubId(clubId);
        n.setAuthorUserId(req.getId());
        n.setTitle(title);
        n.setContent(content);
        return ResponseEntity.ok(news.save(n));
    }

    /* Leader/Admin: delete news */
    @DeleteMapping("/{clubId}/news/{newsId}")
    public ResponseEntity<?> deleteNews(@PathVariable Long clubId, @PathVariable Long newsId, @RequestParam String requesterEmail) {
        var req = byEmail(requesterEmail).orElse(null);
        if (req == null) return ResponseEntity.status(403).body(Map.of("message", "Login required"));
        boolean allowed = isAdmin(req) || isLeader(clubId, req.getId()) || isCoLeader(clubId, req.getId());
        if (!allowed) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        var nOpt = news.findById(newsId);
        if (nOpt.isEmpty() || !nOpt.get().getClubId().equals(clubId))
            return ResponseEntity.status(404).body(Map.of("message", "News not found"));
        news.deleteById(newsId);
        return ResponseEntity.ok(Map.of("status", "success"));
    }

    // GET /api/clubs/{clubId}/status?requesterEmail=me@example.com
    @GetMapping("/{clubId}/status")
    public ResponseEntity<?> myStatus(@PathVariable Long clubId,
                                      @RequestParam String requesterEmail) {
        var uOpt = users.findByEmail(requesterEmail);
        if (uOpt.isEmpty()) return ResponseEntity.status(403).body(Map.of("message", "Login required"));
        var u = uOpt.get();
        if (!clubs.existsById(clubId)) return ResponseEntity.status(404).body(Map.of("message", "Club not found"));

        boolean isMember = members.existsByClubIdAndUserId(clubId, u.getId());

        var jrOpt = requests.findByClubIdAndUserId(clubId, u.getId());
        boolean hasPending = jrOpt.isPresent() && jrOpt.get().getStatus() == JoinRequest.Status.PENDING;
        Long requestId = hasPending ? jrOpt.get().getId() : null;

        return ResponseEntity.ok(Map.of(
                "isMember", isMember,
                "hasPending", hasPending,
                "requestId", requestId
        ));
    }

    // DELETE /api/clubs/{clubId}/join-requests/{requestId}?requesterEmail=me@example.com
    @DeleteMapping("/{clubId}/join-requests/{requestId}")
    public ResponseEntity<?> cancelMine(@PathVariable Long clubId,
                                        @PathVariable Long requestId,
                                        @RequestParam String requesterEmail) {
        var uOpt = users.findByEmail(requesterEmail);
        if (uOpt.isEmpty()) return ResponseEntity.status(403).body(Map.of("message", "Login required"));
        var u = uOpt.get();

        var jrOpt = requests.findById(requestId);
        if (jrOpt.isEmpty() || !jrOpt.get().getClubId().equals(clubId))
            return ResponseEntity.status(404).body(Map.of("message", "Request not found"));

        var jr = jrOpt.get();
        // requester can cancel their own PENDING request; admins/leaders can already manage via your other endpoint
        boolean isOwner = Objects.equals(jr.getUserId(), u.getId());
        if (!isOwner) return ResponseEntity.status(403).body(Map.of("message", "Not allowed"));

        if (jr.getStatus() != JoinRequest.Status.PENDING)
            return ResponseEntity.badRequest().body(Map.of("message", "Only pending requests can be cancelled"));

        requests.deleteById(requestId);
        return ResponseEntity.ok(Map.of("status", "cancelled"));
    }

    @PostMapping("/{clubId}/leave")
    public ResponseEntity<?> leaveClub(@PathVariable Long clubId,
                                       @RequestParam String requesterEmail) {
        var u = users.findByEmail(requesterEmail).orElse(null);
        if (u == null) return ResponseEntity.status(403).body(Map.of("message", "Login required"));
        var m = members.findByClubIdAndUserId(clubId, u.getId())
                .orElse(null);
        if (m == null) return ResponseEntity.status(400).body(Map.of("message", "You are not a member"));

        // Optional: prevent the last leader from leaving
        if (m.getRole() == Role.LEADER) {
            long leaderCount = members.countByClubIdAndRole(clubId, Role.LEADER);
            if (leaderCount <= 1) {
                return ResponseEntity.status(409).body(Map.of(
                        "message", "You are the only leader. Assign another leader before leaving."
                ));
            }
        }

        members.deleteById(m.getId());
        // If a pending request exists (shouldn’t if member, but clean up anyway)
        requests.findByClubIdAndUserId(clubId, u.getId())
                .filter(r -> r.getStatus() == JoinRequest.Status.PENDING)
                .ifPresent(r -> requests.deleteById(r.getId()));

        return ResponseEntity.ok(Map.of("status", "left"));
    }

    @PostMapping("/{clubId}/members/{targetUserId}/make-leader")
    public ResponseEntity<?> makeLeader(@PathVariable Long clubId,
                                        @PathVariable Long targetUserId,
                                        @RequestParam String requesterEmail) {
        var requesterOpt = users.findByEmail(requesterEmail);
        if (requesterOpt.isEmpty()) return ResponseEntity.status(403).body(Map.of("message", "Login Required"));
        var requester = requesterOpt.get();

        boolean requesterIsAdmin = requester.getRole() == User.Role.ADMIN;
        boolean requesterIsLeader = members.existsByClubIdAndUserId(clubId, requester.getId()) &&
                members.findByClubIdAndUserId(clubId, requester.getId())
                        .map(cm -> cm.getRole() == ClubMember.Role.LEADER).orElse(false);

        if (!(requesterIsAdmin || requesterIsLeader)) {
            return ResponseEntity.status(403).body(Map.of("message", "Not allowed"));
        }
        var targetOpt = members.findByClubIdAndUserId(clubId, targetUserId);
        if (targetOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "User is not a member of this club"));

        var target = targetOpt.get();
        target.setRole(ClubMember.Role.LEADER);
        members.save(target);

        return ResponseEntity.ok(Map.of("status", "promoted", "userId", targetUserId, "role", "LEADER"));
    }

    @PostMapping("/{clubId}/members/{targetUserId}/make-co_leader")
    public ResponseEntity<?> makeCoLeader(@PathVariable Long clubId,
                                        @PathVariable Long targetUserId,
                                        @RequestParam String requesterEmail) {
        var requesterOpt = users.findByEmail(requesterEmail);
        if (requesterOpt.isEmpty()) return ResponseEntity.status(403).body(Map.of("message", "Login Required"));
        var requester = requesterOpt.get();

        boolean requesterIsAdmin = requester.getRole() == User.Role.ADMIN;
        boolean requesterIsLeader = members.existsByClubIdAndUserId(clubId, requester.getId()) &&
                members.findByClubIdAndUserId(clubId, requester.getId())
                        .map(cm -> cm.getRole() == ClubMember.Role.LEADER).orElse(false);

        if (!(requesterIsAdmin || requesterIsLeader)) {
            return ResponseEntity.status(403).body(Map.of("message", "Not allowed"));
        }
        var targetOpt = members.findByClubIdAndUserId(clubId, targetUserId);
        if (targetOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "User is not a member of this club"));

        var target = targetOpt.get();
        target.setRole(Role.CO_LEADER);
        members.save(target);

        return ResponseEntity.ok(Map.of("status", "promoted", "userId", targetUserId, "role", "LEADER"));
    }

    @PostMapping("/{clubId}/members/{targetUserId}/make-member")
    public ResponseEntity<?> makeMember(@PathVariable Long clubId,
                                        @PathVariable Long targetUserId,
                                        @RequestParam String requesterEmail) {
        var requesterOpt = users.findByEmail(requesterEmail);
        if (requesterOpt.isEmpty()) return ResponseEntity.status(403).body(Map.of("message", "Login required"));
        var requester = requesterOpt.get();

        boolean requesterIsAdmin = requester.getRole() == User.Role.ADMIN;
        boolean requesterIsLeader = members.existsByClubIdAndUserId(clubId, requester.getId()) &&
                members.findByClubIdAndUserId(clubId, requester.getId())
                        .map(cm -> cm.getRole() == ClubMember.Role.LEADER).orElse(false);

        if (!(requesterIsAdmin || requesterIsLeader)) {
            return ResponseEntity.status(403).body(Map.of("message", "Not allowed"));
        }

        var targetOpt = members.findByClubIdAndUserId(clubId, targetUserId);
        if (targetOpt.isEmpty())
            return ResponseEntity.status(404).body(Map.of("message", "User is not a member of this club"));

        var target = targetOpt.get();
        target.setRole(ClubMember.Role.MEMBER);
        members.save(target);

        return ResponseEntity.ok(Map.of("status", "demoted", "userId", targetUserId, "role", "MEMBER"));
    }
}
