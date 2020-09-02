package com.example.ovidiupodina.emotion.storage;

import android.content.Context;

import com.example.ovidiupodina.emotion.database.DatabaseHelper;

public class Database {

    private volatile static Database instance;
    private DatabaseHelper db;

    private Database(Context context) {
        db = new DatabaseHelper(context);
    }

    public static Database getInstance(Context context) {
        Database result = instance;
        if (result == null) {
            synchronized (Database.class) {
                result = instance;
                if (result == null) {
                    instance = result = new Database(context);
                }
            }
        }
        return result;
    }

    public DatabaseHelper getDb() {
        return db;
    }
}
