package com.example.demo.repository;

import com.example.demo.entity.User;
import com.example.demo.enumuration.ERole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findUserByUsername(String username);

    Optional<User> findUserByUsernameOrEmail(String username, String email);

    Optional<User> findUserByRefreshToken(String token);

    Optional<User> findUserById(String id);

    Optional<User> findUserByEmail(String email);

    Optional<User> findFirstByPhoneNumber(String phoneNumber);

    List<User> findAllByRole_NameIn(Collection<ERole> roles);

    Boolean existsByEmail(String email);

    Boolean existsByUsername(String username);

    Boolean existsByPhoneNumber(String phoneNumber);

    Boolean existsByPhoneNumberAndIdNot(String phoneNumber, String id);
}
