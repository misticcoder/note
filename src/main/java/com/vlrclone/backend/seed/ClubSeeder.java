package com.vlrclone.backend.seed;

import com.vlrclone.backend.Enums.ClubCategory;
import com.vlrclone.backend.Enums.LinkType;
import com.vlrclone.backend.model.*;
import com.vlrclone.backend.repository.*;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Order(3)
@Component
public class ClubSeeder {

    private final ClubRepository clubRepo;
    private final ClubMemberRepository clubMemberRepo;
    private final ClubNewsRepository clubNewsRepo;
    private final ClubLinkRepository clubLinkRepo;
    private final UserRepository userRepo;

    private final Random random = new Random();

    public ClubSeeder(
            ClubRepository clubRepo,
            ClubMemberRepository clubMemberRepo,
            ClubNewsRepository clubNewsRepo,
            ClubLinkRepository clubLinkRepo,
            UserRepository userRepo
    ) {
        this.clubRepo = clubRepo;
        this.clubMemberRepo = clubMemberRepo;
        this.clubNewsRepo = clubNewsRepo;
        this.clubLinkRepo = clubLinkRepo;
        this.userRepo = userRepo;
    }

    public void seed() {

        if (clubRepo.count() > 0) return;

        List<User> users = userRepo.findAll();
        if (users.size() < 5) return;

        String[] names = {
                "Informatics Football",
                "AI & Machine Learning Society",
                "Hackathon Society",
                "Cyber Security Club",
                "Photography Society",
                "Chess Club",
                "Robotics Club",
                "Basketball Team",
                "Entrepreneurship Society",
                "Game Development Group"
        };

        String[] descriptions = {
                "Weekly competitive football sessions and tournaments.",
                "Talks, workshops and AI projects.",
                "Competitive coding and university hackathons.",
                "Ethical hacking, CTFs and security workshops.",
                "Creative photography walks and competitions.",
                "Weekly chess tournaments and strategy sessions.",
                "Robotics projects and hardware workshops.",
                "Competitive basketball league participation.",
                "Startup mentoring and business networking.",
                "Game jams and indie game projects."
        };

        for (int i = 0; i < names.length; i++) {

            Club club = new Club(
                    ClubCategory.values()[random.nextInt(ClubCategory.values().length)],
                    names[i],
                    descriptions[i]
            );

            club.setCreatedAt(
                    LocalDateTime.now().minusDays(random.nextInt(300))
            );

            club.setLogoUrl(
                    "https://picsum.photos/200?random=" + random.nextInt(1000)
            );

            clubRepo.save(club);

            seedMembers(club, users);
            seedLinks(club);
            seedAnnouncements(club, users);
        }
    }

    // =========================================
    // MEMBERS
    // =========================================

    private void seedMembers(Club club, List<User> users) {

        Collections.shuffle(users);

        int memberCount = 10 + random.nextInt(15);

        // Leader
        ClubMember leader = new ClubMember();
        leader.setClub(club);
        leader.setUser(users.get(0));
        leader.setRole(ClubMember.Role.LEADER);
        clubMemberRepo.save(leader);

        // Co-leaders
        for (int i = 1; i <= 2; i++) {
            ClubMember co = new ClubMember();
            co.setClub(club);
            co.setUser(users.get(i));
            co.setRole(ClubMember.Role.CO_LEADER);
            clubMemberRepo.save(co);
        }

        // Regular members
        for (int i = 3; i < Math.min(memberCount, users.size()); i++) {
            ClubMember member = new ClubMember();
            member.setClub(club);
            member.setUser(users.get(i));
            member.setRole(ClubMember.Role.MEMBER);
            clubMemberRepo.save(member);
        }
    }

    // =========================================
    // SOCIAL LINKS
    // =========================================

    private void seedLinks(Club club) {

        if (random.nextBoolean()) {
            ClubLink discord = new ClubLink();
            discord.setClub(club);
            discord.setType(LinkType.DISCORD);
            discord.setUrl("https://discord.gg/" + UUID.randomUUID().toString().substring(0, 8));
            clubLinkRepo.save(discord);
        }

        if (random.nextBoolean()) {
            ClubLink instagram = new ClubLink();
            instagram.setClub(club);
            instagram.setType(LinkType.INSTAGRAM);
            instagram.setUrl("https://instagram.com/" + club.getName().replaceAll(" ", "").toLowerCase());
            clubLinkRepo.save(instagram);
        }
    }

    // =========================================
    // ANNOUNCEMENTS
    // =========================================

    private void seedAnnouncements(Club club, List<User> users) {

        int announcementCount = 3 + random.nextInt(4);

        for (int i = 0; i < announcementCount; i++) {

            ClubNews news = new ClubNews();
            news.setClubId(club.getId());
            news.setAuthorUserId(users.get(random.nextInt(users.size())).getId());
            news.setTitle(generateAnnouncementTitle());
            news.setContent(generateAnnouncementContent());
            news.setCreatedAt(
                    LocalDateTime.now().minusDays(random.nextInt(30))
            );

            clubNewsRepo.save(news);
        }
    }

    private String generateAnnouncementTitle() {
        String[] titles = {
                "Weekly Session Update",
                "Important Announcement",
                "Upcoming Competition",
                "New Members Welcome",
                "Event Reminder",
                "Leadership Update"
        };

        return titles[random.nextInt(titles.length)];
    }

    private String generateAnnouncementContent() {
        String[] content = {
                "Don't forget our weekly meetup this Thursday.",
                "We are excited to announce our upcoming tournament.",
                "New leadership positions are now open.",
                "Thanks to everyone who attended last week's event.",
                "We have partnered with another society for a joint event.",
                "Registration is now open for our next workshop."
        };

        return content[random.nextInt(content.length)];
    }
}
