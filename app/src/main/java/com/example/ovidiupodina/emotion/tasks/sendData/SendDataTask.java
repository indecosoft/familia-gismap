package com.example.ovidiupodina.emotion.tasks.sendData;

import android.app.Notification;
import android.os.AsyncTask;
import android.util.Log;

import com.example.ovidiupodina.emotion.Constants;

import org.json.JSONArray;
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

import javax.net.ssl.HttpsURLConnection;

public class SendDataTask extends AsyncTask<String, Void, String> {
    private com.example.ovidiupodina.emotion.tasks.sendData.ISendDataListener ISendDataListener;

    private String data = "";

    public SendDataTask(com.example.ovidiupodina.emotion.tasks.sendData.ISendDataListener ISendDataListener) {
        this.ISendDataListener = ISendDataListener;
    }

    @Override
    protected String doInBackground(String... strings) {
        try {
            HttpURLConnection connection = (HttpURLConnection) new URL(strings[0]).openConnection();
            connection.setReadTimeout(60000);
            connection.setConnectTimeout(60000);
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoInput(true);
            connection.setDoOutput(true);

            OutputStream os = connection.getOutputStream();
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(os, StandardCharsets.UTF_8));

            data = this.ISendDataListener.onReadFile();
            this.ISendDataListener.onClearFile();

            if (data != null && !data.equals("")) {
                String[] objs = data.split(";");

                JSONArray array = new JSONArray();
                for (String obj : objs) {
                    array.put(new JSONObject(obj));
                }
                writer.write(array.toString());
                writer.flush();
            } else {
                Log.w("$$$$$$$$$$$$$$$$$$$$", "$$$$$$$$$$$$$$$$$");
                return null;
            }

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
        String body = res;

        if (res == null) {
            body = "Nu s-a putut realiza conexiunea la server! (datele nu au fost trimise)";
            try {
                if (data != null && !data.equals("")) {
                    JSONArray jData = new JSONArray(data);
                    StringBuilder d = new StringBuilder();
                    for (int i = 0; i < jData.length(); i++) {
                        d.append(jData.get(i)).append(";");
                    }

                    ISendDataListener.onWriteFile(d.toString());
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        Notification.Builder nb = ISendDataListener.onGetAndroidChannelNotification("Data!", body);
        ISendDataListener.onGetManager().notify(Constants.RES_SEND_DATA, nb.build());
    }
}