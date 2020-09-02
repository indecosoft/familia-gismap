package com.example.ovidiupodina.emotion.database;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.support.annotation.Nullable;
import android.util.Log;

public class DatabaseHelper extends SQLiteOpenHelper {

    private static final String DATABASE_NAME = "Student.db";

    public static final String TABLE_MEASUREMENTS = "measurements_table";
    public static final String TABLE_ALERTS = "alerts_table";
    private static final String TABLE_SAFE_ZONE = "safe_zone";


    public DatabaseHelper(@Nullable Context context) {
        super(context, DATABASE_NAME, null, 1);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE " + TABLE_MEASUREMENTS + " (ID INTEGER PRIMARY KEY AUTOINCREMENT, DATA TEXT NOT NULL)");
        db.execSQL("CREATE TABLE " + TABLE_ALERTS + " (ID INTEGER PRIMARY KEY AUTOINCREMENT, DATA TEXT NOT NULL)");
        db.execSQL("CREATE TABLE " + TABLE_SAFE_ZONE + " (ID INTEGER PRIMARY KEY AUTOINCREMENT, LATITUDINE TEXT NOT NULL, LONGITUDINE TEXT NOT NULL)");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_MEASUREMENTS);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_ALERTS);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_SAFE_ZONE);
        onCreate(db);
    }

    public void setSafeZone(String latitudine, String longitudine) {
//        this.getWritableDatabase().execSQL("DELETE FROM " + TABLE_SAFE_ZONE);

        String[] safe = getSafeZone();

        if (safe == null) {
            ContentValues contentValues = new ContentValues();
            contentValues.put("latitudine", latitudine);
            contentValues.put("longitudine", longitudine);
            this.getWritableDatabase().insert(TABLE_SAFE_ZONE, null, contentValues);
        }
    }

    public String[] getSafeZone() {
        try {
            Cursor c = this.getWritableDatabase().rawQuery("SELECT * FROM " + TABLE_SAFE_ZONE, null);

            if (c.getCount() == 0) {
                return null;
            }

            c.moveToNext();

            String[] res = new String[] {c.getString(0), c.getString(1), c.getString(2)};
            c.close();
            return res;

        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public void updateSafeZone(String id, String latitudine, String longitudine) {
        ContentValues contentValues = new ContentValues();
        contentValues.put("latitudine", latitudine);
        contentValues.put("longitudine", longitudine);

        this.getWritableDatabase().update(TABLE_SAFE_ZONE, contentValues, "ID = ?", new String[]{id});
    }

    public void insert(String table, String data) {
        Log.e(DatabaseHelper.class.getSimpleName(), "insert: " + data);
        ContentValues contentValues = new ContentValues();
        contentValues.put("DATA", data);
        this.getWritableDatabase().insert(table, null, contentValues);
//        return this.getWritableDatabase().insert(table, null, contentValues) == -1; // daca nu mere aia de sus
    }

    public Cursor getData(String table) {
        return this.getWritableDatabase().rawQuery("SELECT * FROM " + table, null);
    }

    public void delete(String table, String id) {
        this.getWritableDatabase().delete(table, "ID = ?", new String[]{id});
    }
}
