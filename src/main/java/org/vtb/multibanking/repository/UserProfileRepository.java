package org.vtb.multibanking.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import org.vtb.multibanking.entity.quest.UserProfileEntity;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserProfileRepository extends MongoRepository<UserProfileEntity, String> {
    Optional<UserProfileEntity> findByUserId(String userId);
}
