package com.vlrclone.backend.seed;

import com.vlrclone.backend.Enums.ClubCategory;
import com.vlrclone.backend.model.Club;
import com.vlrclone.backend.repository.ClubRepository;
import org.springframework.stereotype.Component;

@Component
public class ClubSeeder {

    private final ClubRepository clubRepo;

    public ClubSeeder(ClubRepository clubRepo) {
        this.clubRepo = clubRepo;
    }

    public void seed() {

        createIfMissing(
                ClubCategory.SPORTS,
                "Informatics Football",
                "Weekly 5-a-side football sessions"
        );

        createIfMissing(
                ClubCategory.ACADEMIC,
                "Hackathon Society",
                "Competitive coding & hackathons"
        );

        createIfMissing(
                ClubCategory.SOCIETY,
                "AI & Machine Learning Group",
                "Talks, projects, and workshops"
        );
    }

    private void createIfMissing(
            ClubCategory category,
            String name,
            String description
    ) {
        if (clubRepo.findByName(name).isPresent()) return;

        clubRepo.save(new Club(category, name, description));
    }

}
