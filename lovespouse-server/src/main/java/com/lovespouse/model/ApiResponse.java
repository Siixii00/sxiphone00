package com.lovespouse.model;

public class ApiResponse {
    
    private boolean ok;
    private String message;
    private String bluetooth;

    public ApiResponse(boolean ok, String message) {
        this.ok = ok;
        this.message = message;
    }

    public ApiResponse(boolean ok, String message, String bluetooth) {
        this.ok = ok;
        this.message = message;
        this.bluetooth = bluetooth;
    }

    public boolean isOk() {
        return ok;
    }

    public void setOk(boolean ok) {
        this.ok = ok;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getBluetooth() {
        return bluetooth;
    }

    public void setBluetooth(String bluetooth) {
        this.bluetooth = bluetooth;
    }
}
