export const REF_BADGE_MAP = {
    CLUB: "badge--yellow",
    EVENT: "badge--purple",
    THREAD: "badge--blue",
    USER: "badge--yellow",
    POST: "badge--indigo",
    DEFAULT: "badge--gray",
};

export const getRefBadgeClass = (type) =>
    REF_BADGE_MAP[type] ?? REF_BADGE_MAP.DEFAULT;
