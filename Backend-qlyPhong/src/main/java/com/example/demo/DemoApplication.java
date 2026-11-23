package com.example.demo;

import com.example.demo.entity.Role;
import com.example.demo.enumuration.ERole;
import com.example.demo.model.DTO.user.UserDto;
import com.example.demo.service.interfaces.RoleService;
import com.example.demo.service.interfaces.UserService;
import lombok.AllArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
@AllArgsConstructor
public class DemoApplication {
    private final RoleService roleService;
    private final UserService userService;

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
    @Bean
    CommandLineRunner runner() {
        return args -> {
            if (roleService.findRole(ERole.MANAGER).isEmpty())
                roleService.saveRole(new Role(null, ERole.MANAGER));
            if (roleService.findRole(ERole.STAFF).isEmpty())
                roleService.saveRole(new Role(null, ERole.STAFF));
            if (roleService.findRole(ERole.USER).isEmpty())
                roleService.saveRole(new Role(null, ERole.USER));

            if (userService.statistic() == null) {
                userService.createUser(UserDto.builder().fullName("Administrator").email("admin@example.com").build());
                // Username: admin@example.com
                // Password default: 12345
            }
        };
    }
}
