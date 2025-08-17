package com.vlrclone.backend.model;

public class Context {

    private User currentUser;

    public Context(){
        currentUser = new Guest();
    }

    public void setCurrentUser(User currentUser){
        this.currentUser = currentUser;
    }

    public User getCurrentUser(){
        return currentUser;
    }

    public void addPage(){

    }
}
