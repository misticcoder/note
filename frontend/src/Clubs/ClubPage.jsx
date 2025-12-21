import ClubHeader from "../ClubHeader";

export default function ClubPage() {
    const { clubId, tab } = useClubRoute();
    const club = useClub(clubId);
    const membership = useMembership(clubId);

    return (
        <>
            <ClubHeader
                club={{
                    id: club.id,
                    name: club.name,
                    shortName: club.tag,
                    website: club.website,
                    twitter: club.twitter,
                    country: club.country,
                    logoUrl: club.logoUrl,
                    description: club.description
                }}
                leaders={leaderNames}
                membership={{
                    isMember: effectiveIsMember,
                    hasPending: myStatus.hasPending,
                    isLeader
                }}
                activeTab="overview"
                onJoin={requestJoinClub}
                onLeave={leaveClub}
                onCancelRequest={cancelJoinRequest}
            />

            {tab === "overview" && <ClubOverview club={club} />}
            {tab === "members" && <ClubMembers clubId={clubId} />}
            {tab === "news" && <ClubNews clubId={clubId} />}
        </>
    );
}
