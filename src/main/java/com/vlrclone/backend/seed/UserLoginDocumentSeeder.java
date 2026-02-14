package com.vlrclone.backend.seed;

import com.vlrclone.backend.model.ClubMember;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.ClubMemberRepository;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

@Order(10) // Run after all other seeders
@Component
public class UserLoginDocumentSeeder {

    private final UserRepository userRepo;
    private final ClubMemberRepository clubMemberRepo;

    public UserLoginDocumentSeeder(
            UserRepository userRepo,
            ClubMemberRepository clubMemberRepo
    ) {
        this.userRepo = userRepo;
        this.clubMemberRepo = clubMemberRepo;
    }

    public void seed() {
        try {
            Path outputPath = Paths.get("UserLogin.txt");

            // Check if file already exists
            if (Files.exists(outputPath)) {
                System.out.println("⚠️ UserLogin.txt already exists, skipping generation");
                return;
            }

            List<User> allUsers = userRepo.findAll();

            if (allUsers.isEmpty()) {
                System.out.println("⚠️ No users found to document");
                return;
            }

            StringBuilder content = new StringBuilder();

            // Header
            content.append("═══════════════════════════════════════════════════════════════\n");
            content.append("                    USER LOGIN CREDENTIALS                      \n");
            content.append("                   InfCom Testing System                        \n");
            content.append("═══════════════════════════════════════════════════════════════\n\n");

            content.append("📌 IMPORTANT NOTES:\n");
            content.append("   • All passwords are: 'password' (without quotes)\n");
            content.append("   • Admin passwords are: 'password' (without quotes)\n");
            content.append("   • Use these accounts to test different user roles\n");
            content.append("   • Club roles: LEADER, CO_LEADER, MEMBER\n");
            content.append("   • User roles: ADMIN, STUDENT\n\n");

            content.append("═══════════════════════════════════════════════════════════════\n\n");

            // ================================
            // ADMIN USERS
            // ================================
            content.append("🔧 ADMIN USERS (System Administrators)\n");
            content.append("───────────────────────────────────────────────────────────────\n");

            List<User> admins = allUsers.stream()
                    .filter(u -> u.getRole() == User.Role.ADMIN)
                    .collect(Collectors.toList());

            for (User admin : admins) {
                content.append(formatUserEntry(admin, "password"));
            }

            content.append("\n");

            // ================================
            // STUDENT USERS BY CLUB ROLE
            // ================================
            content.append("═══════════════════════════════════════════════════════════════\n\n");
            content.append("👥 STUDENT USERS (by Club Role)\n");
            content.append("───────────────────────────────────────────────────────────────\n\n");

            List<User> students = allUsers.stream()
                    .filter(u -> u.getRole() == User.Role.STUDENT)
                    .collect(Collectors.toList());

            // Leaders
            content.append("📍 CLUB LEADERS\n");
            content.append("───────────────────────────────────────────────────────────────\n");
            List<User> leaders = getStudentsByClubRole(students, ClubMember.Role.LEADER);
            for (User leader : leaders) {
                content.append(formatUserEntryWithClubs(leader, "password"));
            }
            content.append("\n");

            // Co-Leaders
            content.append("📍 CLUB CO-LEADERS\n");
            content.append("───────────────────────────────────────────────────────────────\n");
            List<User> coLeaders = getStudentsByClubRole(students, ClubMember.Role.CO_LEADER);
            for (User coLeader : coLeaders) {
                content.append(formatUserEntryWithClubs(coLeader, "password"));
            }
            content.append("\n");

            // Regular Members (show only first 10)
            content.append("📍 CLUB MEMBERS (Sample - First 10)\n");
            content.append("───────────────────────────────────────────────────────────────\n");
            List<User> members = getStudentsByClubRole(students, ClubMember.Role.MEMBER)
                    .stream()
                    .limit(10)
                    .collect(Collectors.toList());
            for (User member : members) {
                content.append(formatUserEntryWithClubs(member, "password"));
            }
            content.append("\n");

            // Students with no club
            content.append("📍 STUDENTS WITHOUT CLUB MEMBERSHIP (Sample - First 5)\n");
            content.append("───────────────────────────────────────────────────────────────\n");
            List<User> noClubStudents = students.stream()
                    .filter(u -> clubMemberRepo.findByUserId(u.getId()).isEmpty())
                    .limit(5)
                    .collect(Collectors.toList());
            for (User student : noClubStudents) {
                content.append(formatUserEntry(student, "password"));
            }

            // Footer
            content.append("\n═══════════════════════════════════════════════════════════════\n");
            content.append("                         END OF DOCUMENT                        \n");
            content.append("═══════════════════════════════════════════════════════════════\n");

            // Write to file
            try (FileWriter writer = new FileWriter(outputPath.toFile())) {
                writer.write(content.toString());
            }

            System.out.println("✅ Generated UserLogin.txt with " + allUsers.size() + " user credentials");
            System.out.println("📄 File location: " + outputPath.toAbsolutePath());

        } catch (IOException e) {
            System.err.println("❌ Failed to generate UserLogin.txt: " + e.getMessage());
        }
    }

    private String formatUserEntry(User user, String password) {
        StringBuilder sb = new StringBuilder();

        sb.append(String.format("%-20s: %s\n", "Username", user.getUsername()));
        sb.append(String.format("%-20s: %s\n", "Email", user.getEmail()));
        sb.append(String.format("%-20s: %s\n", "Password", password));
        sb.append(String.format("%-20s: %s\n", "User Role", user.getRole()));
        sb.append(String.format("%-20s: %s\n", "Display Name", user.getDisplayName() != null ? user.getDisplayName() : "N/A"));
        sb.append(String.format("%-20s: %s\n", "Participation Score", user.getParticipationScore()));

        sb.append("\n");
        return sb.toString();
    }

    private String formatUserEntryWithClubs(User user, String password) {
        StringBuilder sb = new StringBuilder();

        sb.append(String.format("%-20s: %s\n", "Username", user.getUsername()));
        sb.append(String.format("%-20s: %s\n", "Email", user.getEmail()));
        sb.append(String.format("%-20s: %s\n", "Password", password));
        sb.append(String.format("%-20s: %s\n", "User Role", user.getRole()));
        sb.append(String.format("%-20s: %s\n", "Display Name", user.getDisplayName() != null ? user.getDisplayName() : "N/A"));
        sb.append(String.format("%-20s: %s\n", "Participation Score", user.getParticipationScore()));

        // Get club memberships
        List<ClubMember> memberships = clubMemberRepo.findByUserId(user.getId());

        if (!memberships.isEmpty()) {
            sb.append(String.format("%-20s:\n", "Club Memberships"));
            for (ClubMember membership : memberships) {
                sb.append(String.format("   • %s (%s)\n",
                        membership.getClub().getName(),
                        membership.getRole()));
            }
        } else {
            sb.append(String.format("%-20s: None\n", "Club Memberships"));
        }

        sb.append("\n");
        return sb.toString();
    }

    private List<User> getStudentsByClubRole(List<User> students, ClubMember.Role role) {
        return students.stream()
                .filter(student -> {
                    List<ClubMember> memberships = clubMemberRepo.findByUserId(student.getId());
                    return memberships.stream().anyMatch(m -> m.getRole() == role);
                })
                .collect(Collectors.toList());
    }
}

/*

This will generate a file like this:
        ```
        ═══════════════════════════════════════════════════════════════
USER LOGIN CREDENTIALS
InfCom Testing System
═══════════════════════════════════════════════════════════════

        📌 IMPORTANT NOTES:
        • All passwords are: 'password' (without quotes)
        • Admin passwords are: 'password' (without quotes)
        • Use these accounts to test different user roles
   • Club roles: LEADER, CO_LEADER, MEMBER
   • User roles: ADMIN, STUDENT

═══════════════════════════════════════════════════════════════

        🔧 ADMIN USERS (System Administrators)
───────────────────────────────────────────────────────────────
Username            : admin1
Email               : admin1@uni.ac.uk
Password            : password
User Role           : ADMIN
Display Name        : Sarah Johnson
Participation Score : 500

Username            : admin2
Email               : admin2@uni.ac.uk
Password            : password
User Role           : ADMIN
Display Name        : Michael Chen
Participation Score : 500

Username            : admin3
Email               : admin3@uni.ac.uk
Password            : password
User Role           : ADMIN
Display Name        : Emily Rodriguez
Participation Score : 500


        ═══════════════════════════════════════════════════════════════

        👥 STUDENT USERS (by Club Role)
───────────────────────────────────────────────────────────────

        📍 CLUB LEADERS
───────────────────────────────────────────────────────────────
Username            : jamesa0
Email               : jamesa0@uni.ac.uk
Password            : password
User Role           : STUDENT
Display Name        : James A.
Participation Score : 245
Club Memberships    :
        • Informatics Football (LEADER)

📍 CLUB CO-LEADERS
───────────────────────────────────────────────────────────────
Username            : emmab1
Email               : emmab1@uni.ac.uk
Password            : password
User Role           : STUDENT
Display Name        : Emma B.
Participation Score : 156
Club Memberships    :
        • Informatics Football (CO_LEADER)

📍 CLUB MEMBERS (Sample - First 10)
───────────────────────────────────────────────────────────────
        [... continues with members ...]

        */