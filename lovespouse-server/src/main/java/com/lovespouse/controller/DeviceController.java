package com.lovespouse.controller;

import com.lovespouse.model.ApiResponse;
import com.lovespouse.model.VibrateRequest;
import com.lovespouse.service.BleBroadcastService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin
public class DeviceController {

    @Autowired
    private BleBroadcastService bleService;

    @PostMapping("/vibrate")
    public ApiResponse vibrate(@Valid @RequestBody VibrateRequest request) {
        boolean success = bleService.sendVibrateCommand(
            request.getIntensity(), 
            request.getDuration()
        );
        
        if (success) {
            return new ApiResponse(true, 
                String.format("Command sent: intensity=%d, duration=%d", 
                    request.getIntensity(), request.getDuration()));
        } else {
            return new ApiResponse(false, "Failed to send command");
        }
    }

    @GetMapping("/health")
    public ApiResponse health() {
        String bluetoothStatus = bleService.isBluetoothAvailable() ? "available" : "unavailable";
        return new ApiResponse(true, "Server is running", bluetoothStatus);
    }
}
