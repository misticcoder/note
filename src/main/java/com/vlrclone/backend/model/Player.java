package com.vlrclone.backend.model;

public class Player {
    private int id;
    private String name;
    public enum Role {
        INITIATOR,
        SENTINEL,
        CONTROLLER,
        DUELIST,
        IGL
    }
    private Club club;
    private Role role;
    public Player(int id, String name, Role role, Club club) {
        this.id = id;
        this.name = name;
        this.role = role;
        this.club = club;
    }
    public int getId() { return id; }
    public String getName() { return name; }
    public Role getRole() { return role; }
    public Club getClub() { return club; }
    public void setId(int id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setRole(Role role) { this.role = role; }
    public void setClub(Club club) { this.club = club; }
}
