package com.vlrclone.backend.repository.spec;

import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.Tag;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

public class EventSpecifications {

    /* =========================
       SEARCH (title, content, location, tag, club)
    ========================= */
    public static Specification<Event> searchText(String q) {
        return (root, query, cb) -> {
            if (q == null || q.trim().isEmpty()) {
                return cb.conjunction();
            }

            String like = "%" + q.trim().toLowerCase() + "%";

            Join<Event, Tag> tagJoin = root.join("tags", JoinType.LEFT);
            Join<Object, Object> clubJoin = root.join("club", JoinType.LEFT);

            query.distinct(true);

            return cb.or(
                    cb.like(cb.lower(root.get("title")), like),
                    cb.like(cb.lower(root.get("content")), like),
                    cb.like(cb.lower(root.get("location")), like),
                    cb.like(cb.lower(tagJoin.get("name")), like),
                    cb.like(cb.lower(clubJoin.get("name")), like)
            );
        };
    }

    /* =========================
       TAG FILTER
    ========================= */
    public static Specification<Event> hasTags(List<String> tags) {
        return (root, query, cb) -> {
            if (tags == null || tags.isEmpty()) {
                return cb.conjunction();
            }

            query.distinct(true);
            Join<Event, Tag> tagJoin = root.join("tags", JoinType.INNER);

            return cb.lower(tagJoin.get("name"))
                    .in(tags.stream().map(String::toLowerCase).toList());
        };
    }

    /* =========================
       SINGLE TAG (for /tag/{name})
    ========================= */
    public static Specification<Event> hasSingleTag(Tag tag) {
        return (root, query, cb) ->
                tag == null ? cb.conjunction() : cb.isMember(tag, root.get("tags"));
    }

    /* =========================
       CLUB FILTER
    ========================= */
    public static Specification<Event> hasClub(Long clubId) {
        return (root, query, cb) -> {
            if (clubId == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("club").get("id"), clubId);
        };
    }

    /* =========================
       STATUS FILTER
    ========================= */
    public static Specification<Event> hasStatus(String status, LocalDateTime now) {
        return (root, query, cb) -> {
            if (status == null || status.equalsIgnoreCase("all")) {
                return cb.conjunction();
            }

            return switch (status.toLowerCase()) {
                case "upcoming" ->
                        cb.greaterThan(root.get("startAt"), now);

                case "ongoing", "live" ->
                        cb.and(
                                cb.lessThanOrEqualTo(root.get("startAt"), now),
                                cb.or(
                                        cb.isNull(root.get("endAt")),
                                        cb.greaterThanOrEqualTo(root.get("endAt"), now)
                                )
                        );

                case "past", "ended" ->
                        cb.or(
                                cb.lessThan(root.get("endAt"), now),
                                cb.and(
                                        cb.isNull(root.get("endAt")),
                                        cb.lessThan(root.get("startAt"), now)
                                )
                        );

                default -> cb.conjunction();
            };
        };
    }

    /* =========================
       TIME PERIOD FILTER (NEW)
       Filter events by when they start
    ========================= */
    public static Specification<Event> inTimePeriod(String timePeriod, LocalDateTime now) {
        return (root, query, cb) -> {
            if (timePeriod == null || "all".equalsIgnoreCase(timePeriod)) {
                return cb.conjunction();
            }

            return switch (timePeriod.toLowerCase()) {
                case "today" -> {
                    LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
                    LocalDateTime endOfDay = startOfDay.plusDays(1);
                    yield cb.and(
                            cb.greaterThanOrEqualTo(root.get("startAt"), startOfDay),
                            cb.lessThan(root.get("startAt"), endOfDay)
                    );
                }
                case "week" -> {
                    // Start of current week (Monday)
                    LocalDateTime startOfWeek = now.toLocalDate()
                            .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                            .atStartOfDay();
                    LocalDateTime endOfWeek = startOfWeek.plusWeeks(1);
                    yield cb.and(
                            cb.greaterThanOrEqualTo(root.get("startAt"), startOfWeek),
                            cb.lessThan(root.get("startAt"), endOfWeek)
                    );
                }
                case "month" -> {
                    // Start of current month
                    LocalDateTime startOfMonth = now.toLocalDate()
                            .with(TemporalAdjusters.firstDayOfMonth())
                            .atStartOfDay();
                    LocalDateTime endOfMonth = startOfMonth.plusMonths(1);
                    yield cb.and(
                            cb.greaterThanOrEqualTo(root.get("startAt"), startOfMonth),
                            cb.lessThan(root.get("startAt"), endOfMonth)
                    );
                }
                default -> cb.conjunction();
            };
        };
    }
}