package com.example.ovidiupodina.emotion.geofacing;

import java.util.ArrayList;
import java.util.List;

public class Geofancing {

    public Geofancing() {
        points = new ArrayList<>();
    }

    private List<Punct> points;

    public void addNewPoint(com.example.ovidiupodina.emotion.geofacing.Punct point) {
        points.add(point);
    }

    public Punct getPoint(int i) {
        return points.get(i);
    }

    public boolean contains(Punct test) {
        boolean result = false;
        for (int i = 0, j = points.size() - 1; i < points.size(); j = i++) {
            if ((points.get(i).getY() > test.getY()) != (points.get(j).getY() > test.getY()) &&
                    (test.getX() < (points.get(j).getX() - points.get(i).getX()) * (test.getY() - points.get(i).getY()) / (points.get(j).getY()-points.get(i).getY()) + points.get(i).getX())) {
                result = !result;
            }
        }
        return result;
    }
}



