package com.memory3d;

import com.memory3d.config.Memory3DConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(Memory3DConfig.class)
public class Memory3DApplication {

    public static void main(String[] args) {
        SpringApplication.run(Memory3DApplication.class, args);
    }
}
