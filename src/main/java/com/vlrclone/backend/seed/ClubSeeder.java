package com.vlrclone.backend.seed;

import com.vlrclone.backend.Enums.ClubCategory;
import com.vlrclone.backend.model.Club;
import com.vlrclone.backend.repository.ClubRepository;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Order(2)
@Component
public class ClubSeeder {

    private final ClubRepository clubRepo;

    public ClubSeeder(ClubRepository clubRepo) {
        this.clubRepo = clubRepo;
    }

    public void seed() {

        create("Informatics Football", ClubCategory.SPORTS, "Weekly 5-a-side sessions");
        create("Basketball Society", ClubCategory.SPORTS, "Competitive and casual games");
        create("Chess Club", ClubCategory.SPORTS, "Strategic board gaming");

        create("Hackathon Society", ClubCategory.ACADEMIC, "Competitive coding events");
        create("AI & ML Group", ClubCategory.ACADEMIC, "Talks & workshops");
        create("Cyber Security Circle", ClubCategory.ACADEMIC, "CTFs & security labs");

        create("Board Games Club", ClubCategory.SOCIAL, "Casual weekly meetups");
        create("Photography Society", ClubCategory.SOCIAL, "Creative workshops");

        create("International Students Network", ClubCategory.FAMILY, "Community support");
        create("Entrepreneurship Hub", ClubCategory.OTHER, "Startup networking");
        create("Music Collective", ClubCategory.SOCIETY, "Jam sessions");
        create("Film Appreciation Society", ClubCategory.SOCIETY, "Screenings & analysis");
    }

    private void create(String name, ClubCategory category, String description) {
        if (clubRepo.findByName(name).isPresent()) return;
        clubRepo.save(new Club(category, name, description));
    }
}
