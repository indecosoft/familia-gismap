package com.example.ovidiupodina.emotion.tasks.missedAlerts;

import android.os.AsyncTask;

import com.example.ovidiupodina.emotion.database.Constants;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;

import javax.net.ssl.HttpsURLConnection;

public class MissedAlerts extends AsyncTask<String, Void, String> {

    private IMissedAlerta iMissedAlerta;
    private ArrayList<String> ids;

    public MissedAlerts(IMissedAlerta iMissedAlerta, ArrayList<String> ids) {
        this.iMissedAlerta = iMissedAlerta;
        this.ids = ids;
    }

    @Override
    protected String doInBackground(String... params) {
        try {
            HttpURLConnection connection = (HttpURLConnection) new URL(Constants.MISSED_ALERT_URL).openConnection();
            connection.setReadTimeout(1500);
            connection.setConnectTimeout(1500);
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoInput(true);
            connection.setDoOutput(true);

            OutputStream os = connection.getOutputStream();
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(os, StandardCharsets.UTF_8));

            writer.write(params[0]);

            writer.flush();
            writer.close();
            os.close();

            if (connection.getResponseCode() == HttpsURLConnection.HTTP_OK) {
                BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = in.readLine()) != null) {
                    sb.append(line);
                }
                in.close();
                connection.disconnect();
                return sb.toString();
            }
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }

        return null;
    }

    @Override
    protected void onPostExecute(String s) {
        super.onPostExecute(s);

        if (s != null) {
            iMissedAlerta.clearData(ids);
        }
    }
}
