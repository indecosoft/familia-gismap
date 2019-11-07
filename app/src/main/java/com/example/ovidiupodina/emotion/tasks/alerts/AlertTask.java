package com.example.ovidiupodina.emotion.tasks.alerts;

import android.app.Notification;
import android.os.AsyncTask;

import com.example.ovidiupodina.emotion.Constants;
import com.example.ovidiupodina.emotion.data.Storage;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

import javax.net.ssl.HttpsURLConnection;

public class AlertTask extends AsyncTask<String, Void, String> {

    private IAlertTask iAlertTask;

    private String tipAlerta = "";

    public AlertTask(IAlertTask iAlertTask) {
        this.iAlertTask = iAlertTask;
    }

    @Override
    protected String doInBackground(String... strings) {

        this.tipAlerta = strings[3];

        try {
            HttpURLConnection connection = (HttpURLConnection) new URL(strings[0]).openConnection();
            connection.setReadTimeout(1500);
            connection.setConnectTimeout(1500);
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoInput(true);
            connection.setDoOutput(true);

            OutputStream os = connection.getOutputStream();
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(os, StandardCharsets.UTF_8));

            JSONObject data = new JSONObject();
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.UK);

            if (strings[1] != null && strings[2] != null && strings[3] != null && strings[4] != null) {
                data.put("imei", strings[1]);
                data.put("coordonate", strings[2]);
                data.put("tipAlerta", tipAlerta);
                data.put("valoare", strings[4]);
                data.put("idClient", Storage.getInstance().getConfig().idClient);
                data.put("dateTime", dateFormat.format(new Date()));
                data.put("idPersAsisoc", Storage.getInstance().getConfig().idPersAsisoc);
            }

            writer.write(data.toString());

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
                return sb.toString();
            }

        } catch (IOException | JSONException e) {
            e.printStackTrace();
            return null;
        }

        return null;
    }

    @Override
    protected void onPostExecute(String res) {
        super.onPostExecute(res);

        String body;

        if (res != null) {
            body = res;
        } else {
            body = "Nu s-a putut realiza conexiunea la server!";
        }

        Notification.Builder nb = iAlertTask.onGetAndroidChannelNotification(this.tipAlerta, body);
        iAlertTask.onGetManager().notify(Constants.RES_SEND_DATA, nb.build());
    }
}
