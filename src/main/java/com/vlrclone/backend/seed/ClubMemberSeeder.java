package com.vlrclone.backend.seed;

import com.vlrclone.backend.model.Club;
import com.vlrclone.backend.model.ClubMember;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.ClubMemberRepository;
import com.vlrclone.backend.repository.ClubRepository;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Random;

@Order(3)
@Component
public class ClubMemberSeeder {

    private final ClubRepository clubRepo;
    private final UserRepository userRepo;
    private final ClubMemberRepository memberRepo;

    public ClubMemberSeeder(
            ClubRepository clubRepo,
            UserRepository userRepo,
            ClubMemberRepository memberRepo
    ) {
        this.clubRepo = clubRepo;
        this.userRepo = userRepo;
        this.memberRepo = memberRepo;
    }

    public void seed() {

        if (memberRepo.count() > 0) return;

        List<Club> clubs = clubRepo.findAll();
        List<User> users = userRepo.findAll();

        if (clubs.isEmpty() || users.isEmpty()) return;

        Random random = new Random();

        for (Club club : clubs) {

            Collections.shuffle(users);

            // Leader
            createMember(club, users.get(0), ClubMember.Role.LEADER);

            // Co-leader
            createMember(club, users.get(1), ClubMember.Role.CO_LEADER);

            // 10 Members
            for (int i = 2; i < Math.min(12, users.size()); i++) {
                createMember(club, users.get(i), ClubMember.Role.MEMBER);
            }
        }
    }

    private void createMember(Club club, User user, ClubMember.Role role) {

        if (memberRepo.existsByClubAndUser(club, user)) return;

        ClubMember member = new ClubMember();
        member.setClub(club);
        member.setUser(user);
        member.setRole(role);

        memberRepo.save(member);
    }
}
