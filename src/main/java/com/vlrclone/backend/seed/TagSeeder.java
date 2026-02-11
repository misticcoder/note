package com.vlrclone.backend.seed;

import com.vlrclone.backend.model.Tag;
import com.vlrclone.backend.repository.TagRepository;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Order(2)
@Component
public class TagSeeder {

    private final TagRepository tagRepo;

    public TagSeeder(TagRepository tagRepo) {
        this.tagRepo = tagRepo;
    }

    public void seed() {

        if (tagRepo.count() > 0) return;

        String[] tags = {
                "football", "coding", "ai", "networking", "workshop",
                "competition", "social", "training", "research",
                "careers", "startup", "cybersecurity", "data"
        };

        for (String name : tags) {
            tagRepo.save(new Tag(name));
        }
    }
}
