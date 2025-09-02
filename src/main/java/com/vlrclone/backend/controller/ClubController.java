// src/main/java/com/vlrclone/backend/controller/ClubController.java
package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.*;
import com.vlrclone.backend.model.ClubMember.ClubRole;
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
        this.clubs=c; this.members=m; this.requests=r; this.news=n; this.users=u;
    }

    /* Utility */
    private Optional<User> byEmail(String email){ return users.findByEmail(email); }
    private boolean isAdmin(User u){ return u.getRole() == Role.ADMIN; }
    private boolean isLeader(Long clubId, Long userId){
        return members.existsByClubIdAndUserIdAndRole(clubId, userId, ClubRole.LEADER);
    }

    /* Public */
    @GetMapping public List<Club> listClubs(){ return clubs.findAll(); }
    @GetMapping("/{clubId}") public ResponseEntity<?> getClub(@PathVariable Long clubId){
        return clubs.findById(clubId).<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).body(Map.of("message","Club not found")));
    }
    @GetMapping("/{clubId}/news") public List<ClubNews> clubNews(@PathVariable Long clubId){
        return news.findByClubIdOrderByCreatedAtDesc(clubId);
    }
    @GetMapping("/{clubId}/members") public List<ClubMember> clubMembers(@PathVariable Long clubId){
        return members.findByClubId(clubId);
    }

    /* Admin: create club */
    @PostMapping
    public ResponseEntity<?> createClub(@RequestParam String requesterEmail, @RequestBody Map<String,String> body){
        var req = byEmail(requesterEmail).orElse(null);
        if (req==null || !isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message","Admin only"));
        String name = body.getOrDefault("name","").trim();
        String description = body.getOrDefault("description","").trim();
        if (name.isBlank() || description.isBlank()) return ResponseEntity.badRequest().body(Map.of("message","name and description required"));
        if (clubs.existsByName(name)) return ResponseEntity.status(409).body(Map.of("message","name already exists"));
        var c = new Club(); c.setName(name); c.setDescription(description);
        return ResponseEntity.ok(clubs.save(c));
    }

    /* Admin: assign leader */
    @PostMapping("/{clubId}/leader")
    public ResponseEntity<?> assignLeader(@PathVariable Long clubId, @RequestParam String requesterEmail, @RequestBody Map<String,Long> body){
        var req = byEmail(requesterEmail).orElse(null);
        if (req==null || !isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message","Admin only"));
        Long userId = body.get("userId");
        if (userId==null) return ResponseEntity.badRequest().body(Map.of("message","userId required"));
        if (!clubs.existsById(clubId)) return ResponseEntity.status(404).body(Map.of("message","Club not found"));

        var cm = members.findByClubIdAndUserId(clubId, userId)
                .orElseGet(()->{ var m=new ClubMember(); m.setClubId(clubId); m.setUserId(userId); return m; });
        cm.setRole(ClubRole.LEADER);
        return ResponseEntity.ok(members.save(cm));
    }

    /* User: request to join */
    @PostMapping("/{clubId}/join")
    public ResponseEntity<?> requestJoin(@PathVariable Long clubId, @RequestParam String requesterEmail){
        var req = byEmail(requesterEmail).orElse(null);
        if (req==null) return ResponseEntity.status(403).body(Map.of("message","Login required"));
        if (!clubs.existsById(clubId)) return ResponseEntity.status(404).body(Map.of("message","Club not found"));

        if (members.existsByClubIdAndUserId(clubId, req.getId()))
            return ResponseEntity.status(409).body(Map.of("message","Already a member"));
        var jr = requests.findByClubIdAndUserId(clubId, req.getId()).orElseGet(JoinRequest::new);
        jr.setClubId(clubId); jr.setUserId(req.getId()); jr.setStatus(Status.PENDING);
        return ResponseEntity.ok(requests.save(jr));
    }

    /* Leader/Admin: list pending requests */
    @GetMapping("/{clubId}/join-requests")
    public ResponseEntity<?> pending(@PathVariable Long clubId, @RequestParam String requesterEmail){
        var req = byEmail(requesterEmail).orElse(null);
        if (req==null) return ResponseEntity.status(403).body(Map.of("message","Login required"));
        boolean allowed = isAdmin(req) || isLeader(clubId, req.getId());
        if (!allowed) return ResponseEntity.status(403).body(Map.of("message","Forbidden"));
        return ResponseEntity.ok(requests.findByClubIdAndStatus(clubId, Status.PENDING));
    }

    /* Leader/Admin: approve/deny */
    @PostMapping("/{clubId}/join-requests/{requestId}/decision")
    public ResponseEntity<?> decide(@PathVariable Long clubId, @PathVariable Long requestId,
                                    @RequestParam String requesterEmail, @RequestParam String decision){
        var req = byEmail(requesterEmail).orElse(null);
        if (req==null) return ResponseEntity.status(403).body(Map.of("message","Login required"));
        boolean allowed = isAdmin(req) || isLeader(clubId, req.getId());
        if (!allowed) return ResponseEntity.status(403).body(Map.of("message","Forbidden"));

        var jrOpt = requests.findById(requestId);
        if (jrOpt.isEmpty() || !jrOpt.get().getClubId().equals(clubId))
            return ResponseEntity.status(404).body(Map.of("message","Request not found"));

        var jr = jrOpt.get();
        if ("approve".equalsIgnoreCase(decision)) {
            jr.setStatus(Status.APPROVED);
            // add member if not exists
            members.findByClubIdAndUserId(clubId, jr.getUserId())
                    .orElseGet(()->{
                        var m = new ClubMember();
                        m.setClubId(clubId); m.setUserId(jr.getUserId()); m.setRole(ClubRole.MEMBER);
                        return members.save(m);
                    });
        } else if ("reject".equalsIgnoreCase(decision)) {
            jr.setStatus(Status.REJECTED);
        } else {
            return ResponseEntity.badRequest().body(Map.of("message","decision must be approve or reject"));
        }
        return ResponseEntity.ok(requests.save(jr));
    }

    /* Leader/Admin: post news */
    @PostMapping("/{clubId}/news")
    public ResponseEntity<?> postNews(@PathVariable Long clubId, @RequestParam String requesterEmail, @RequestBody Map<String,String> body){
        var req = byEmail(requesterEmail).orElse(null);
        if (req==null) return ResponseEntity.status(403).body(Map.of("message","Login required"));
        boolean allowed = isAdmin(req) || isLeader(clubId, req.getId());
        if (!allowed) return ResponseEntity.status(403).body(Map.of("message","Forbidden"));

        String title = body.getOrDefault("title","").trim();
        String content = body.getOrDefault("content","").trim();
        if (title.isBlank() || content.isBlank()) return ResponseEntity.badRequest().body(Map.of("message","title and content required"));

        var n = new ClubNews();
        n.setClubId(clubId); n.setAuthorUserId(req.getId()); n.setTitle(title); n.setContent(content);
        return ResponseEntity.ok(news.save(n));
    }

    /* Leader/Admin: delete news */
    @DeleteMapping("/{clubId}/news/{newsId}")
    public ResponseEntity<?> deleteNews(@PathVariable Long clubId, @PathVariable Long newsId, @RequestParam String requesterEmail){
        var req = byEmail(requesterEmail).orElse(null);
        if (req==null) return ResponseEntity.status(403).body(Map.of("message","Login required"));
        boolean allowed = isAdmin(req) || isLeader(clubId, req.getId());
        if (!allowed) return ResponseEntity.status(403).body(Map.of("message","Forbidden"));

        var nOpt = news.findById(newsId);
        if (nOpt.isEmpty() || !nOpt.get().getClubId().equals(clubId))
            return ResponseEntity.status(404).body(Map.of("message","News not found"));
        news.deleteById(newsId);
        return ResponseEntity.ok(Map.of("status","success"));
    }
}
