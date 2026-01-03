package com.vlrclone.backend.repository.spec;

import com.vlrclone.backend.Enums.ClubCategory;
import com.vlrclone.backend.model.Club;
import org.springframework.data.jpa.domain.Specification;

public class ClubSpecifications {

    public static Specification<Club> textSearch(String q) {
        return (root, query, cb) -> {
            if (q == null || q.isBlank()) return cb.conjunction();

            String like = "%" + q.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), like),
                    cb.like(cb.lower(root.get("description")), like)
            );
        };
    }

    public static Specification<Club> hasCategory(ClubCategory category) {
        return (root, query, cb) ->
                category == null ? cb.conjunction()
                        : cb.equal(root.get("category"), category);
    }
}
