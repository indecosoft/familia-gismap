package com.example.ovidiupodina.emotion.tasks.sendData;

import android.os.AsyncTask;

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

public class SendDataTask extends AsyncTask<String, Void, String> {
    private com.example.ovidiupodina.emotion.tasks.sendData.ISendDataListener ISendDataListener;

    private ArrayList<String> ids;

    public SendDataTask(com.example.ovidiupodina.emotion.tasks.sendData.ISendDataListener ISendDataListener, ArrayList<String> ids) {
        this.ISendDataListener = ISendDataListener;
        this.ids = ids;
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

            writer.write(strings[1]);
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
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }

        return null;
    }

    @Override
    protected void onPostExecute(String res) {
        super.onPostExecute(res);

        if (res != null) {
            this.ISendDataListener.onSendDataDone(ids);
        }
    }
}