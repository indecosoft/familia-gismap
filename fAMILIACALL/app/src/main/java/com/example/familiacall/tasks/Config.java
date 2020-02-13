package com.example.familiacall.tasks;

import android.os.AsyncTask;
import android.util.Log;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class Config extends AsyncTask<String, Void, String> {

    public interface IConfig {
        void onResponse(String res);
    }

    private HttpURLConnection connection;
    private IConfig iConfig;

    public Config(IConfig iConfig) {
        this.iConfig = iConfig;
    }

    @Override
    protected String doInBackground(String... strings) {
        try {
            connection = (HttpURLConnection) new URL(strings[0]).openConnection();
            connection.setReadTimeout(15000);
            connection.setConnectTimeout(15000);
            connection.setRequestMethod("GET");

            if (connection.getResponseCode() == HttpURLConnection.HTTP_OK) {
                BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = in.readLine()) != null) {
                    sb.append(line);
                }
                in.close();

                return sb.toString();
            }
            Log.e(Config.class.getSimpleName(), connection.getResponseMessage());
        } catch (IOException e) {
            e.printStackTrace();
            Log.e(Config.class.getSimpleName(), "" + e.getMessage());
            return null;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }

        return null;
    }

    @Override
    protected void onPostExecute(String res) {
        super.onPostExecute(res);
        iConfig.onResponse(res);
    }
}
