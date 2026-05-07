package com.lovespouse.service;

import org.springframework.stereotype.Service;
import java.util.logging.Logger;

@Service
public class BleBroadcastService {

    private static final Logger logger = Logger.getLogger(BleBroadcastService.class.getName());
    
    private static final int COMPANY_ID = 0xFFF0;
    
    private static final byte[] PREFIX = {
        (byte) 0x6D, (byte) 0xB6, (byte) 0x43, (byte) 0xCE,
        (byte) 0x97, (byte) 0xFE, (byte) 0x42, (byte) 0x7C
    };
    
    private static final byte[][] COMMAND_CODES = {
        {(byte) 0xE5, (byte) 0x15, (byte) 0x7D},
        {(byte) 0xE4, (byte) 0x9C, (byte) 0x6C},
        {(byte) 0xE7, (byte) 0x07, (byte) 0x5E},
        {(byte) 0xE6, (byte) 0x8E, (byte) 0x4F}
    };
    
    private boolean bluetoothAvailable = false;

    public BleBroadcastService() {
        checkBluetoothAvailability();
    }

    private void checkBluetoothAvailability() {
        String os = System.getProperty("os.name", "").toLowerCase();
        logger.info("Operating System: " + os);
        
        if (os.contains("win")) {
            bluetoothAvailable = checkWindowsBluetooth();
        } else if (os.contains("linux")) {
            bluetoothAvailable = checkLinuxBluetooth();
        } else if (os.contains("mac")) {
            bluetoothAvailable = checkMacBluetooth();
        }
        
        logger.info("Bluetooth available: " + bluetoothAvailable);
    }

    private boolean checkWindowsBluetooth() {
        try {
            ProcessBuilder pb = new ProcessBuilder("powershell", "-Command", 
                "Get-Service bthserv | Select-Object -ExpandProperty Status");
            Process p = pb.start();
            p.waitFor();
            return p.exitValue() == 0;
        } catch (Exception e) {
            logger.warning("Failed to check Windows Bluetooth: " + e.getMessage());
            return false;
        }
    }

    private boolean checkLinuxBluetooth() {
        java.io.File bluetoothDir = new java.io.File("/sys/class/bluetooth");
        return bluetoothDir.exists();
    }

    private boolean checkMacBluetooth() {
        try {
            ProcessBuilder pb = new ProcessBuilder("system_profiler", "SPBluetoothDataType");
            Process p = pb.start();
            p.waitFor();
            return p.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isBluetoothAvailable() {
        return bluetoothAvailable;
    }

    public boolean sendVibrateCommand(int intensity, int duration) {
        if (intensity < 0 || intensity > 3) {
            logger.warning("Invalid intensity: " + intensity);
            return false;
        }

        byte[] commandCode = COMMAND_CODES[intensity];
        byte[] manufacturerData = buildManufacturerData(commandCode);
        
        logger.info(String.format(
            "Sending BLE broadcast - Company ID: 0x%04X, Intensity: %d, Duration: %ds",
            COMPANY_ID, intensity, duration
        ));
        
        logger.info("Manufacturer Data: " + bytesToHex(manufacturerData));
        
        return performBleBroadcast(manufacturerData, duration);
    }

    private byte[] buildManufacturerData(byte[] commandCode) {
        byte[] data = new byte[11];
        System.arraycopy(PREFIX, 0, data, 0, 8);
        System.arraycopy(commandCode, 0, data, 8, 3);
        return data;
    }

    private boolean performBleBroadcast(byte[] manufacturerData, int duration) {
        String os = System.getProperty("os.name", "").toLowerCase();
        
        if (os.contains("win")) {
            return performWindowsBleBroadcast(manufacturerData, duration);
        } else if (os.contains("linux")) {
            return performLinuxBleBroadcast(manufacturerData, duration);
        } else if (os.contains("mac")) {
            return performMacBleBroadcast(manufacturerData, duration);
        }
        
        logger.warning("Unsupported OS for BLE broadcast: " + os);
        return simulateBroadcast(manufacturerData, duration);
    }

    private boolean performWindowsBleBroadcast(byte[] data, int duration) {
        logger.info("Windows BLE broadcast - using simulated mode");
        logger.info("Note: For actual BLE broadcast, consider using tinyb library or Windows Bluetooth LE APIs");
        return simulateBroadcast(data, duration);
    }

    private boolean performLinuxBleBroadcast(byte[] data, int duration) {
        logger.info("Linux BLE broadcast - using simulated mode");
        logger.info("Note: For actual BLE broadcast, consider using bluez or tinyb library");
        return simulateBroadcast(data, duration);
    }

    private boolean performMacBleBroadcast(byte[] data, int duration) {
        logger.info("macOS BLE broadcast - using simulated mode");
        logger.info("Note: For actual BLE broadcast, consider using CoreBluetooth via JNI");
        return simulateBroadcast(data, duration);
    }

    private boolean simulateBroadcast(byte[] data, int duration) {
        logger.info("=== SIMULATED BLE BROADCAST ===");
        logger.info("Company ID: 0x" + String.format("%04X", COMPANY_ID));
        logger.info("Data: " + bytesToHex(data));
        logger.info("Duration: " + duration + " seconds");
        logger.info("================================");
        return true;
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X ", b));
        }
        return sb.toString().trim();
    }
}
