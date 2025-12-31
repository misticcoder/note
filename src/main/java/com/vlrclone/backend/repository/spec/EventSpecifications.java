package com.vlrclone.backend.repository.spec;

import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.Tag;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import java.time.LocalDateTime;
import java.util.List;

public class EventSpecifications {

    public static Specification<Event> searchText(String q) {
        return (root, query, cb) -> {
            if (q == null || q.trim().isEmpty()) {
                return null;
            }

            String like = "%" + q.trim().toLowerCase() + "%";

            Join<Event, Tag> tagJoin = root.join("tags", JoinType.LEFT);

            return cb.or(
                    cb.like(cb.lower(root.get("title")), like),
                    cb.like(cb.lower(root.get("location")), like),
                    cb.like(cb.lower(tagJoin.get("name")), like)
            );

        };
    }



    public static Specification<Event> hasTags(List<String> tags) {
        return (root, query, cb) -> {
            if (tags == null || tags.isEmpty()) return null;

            query.distinct(true);
            Join<Event, Tag> tagJoin = root.join("tags", JoinType.INNER);

            return cb.lower(tagJoin.get("name"))
                    .in(tags.stream().map(String::toLowerCase).toList());
        };
    }


    public static Specification<Event> hasStatus(String status, LocalDateTime now) {
        return (root, query, cb) -> {
            if (status == null || status.equalsIgnoreCase("all")) return null;

            return switch (status.toLowerCase()) {
                case "upcoming" ->
                        cb.greaterThan(root.get("startAt"), now);

                case "ongoing" ->
                        cb.and(
                                cb.lessThanOrEqualTo(root.get("startAt"), now),
                                cb.or(
                                        cb.isNull(root.get("endAt")),
                                        cb.greaterThanOrEqualTo(root.get("endAt"), now)
                                )
                        );

                case "past" ->
                        cb.or(
                                cb.lessThan(root.get("endAt"), now),
                                cb.and(
                                        cb.isNull(root.get("endAt")),
                                        cb.lessThan(root.get("startAt"), now)
                                )
                        );

                default -> null;
            };
        };
    }
}
