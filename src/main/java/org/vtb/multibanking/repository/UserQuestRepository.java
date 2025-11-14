package org.vtb.multibanking.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import org.vtb.multibanking.entity.quest.UserQuestEntity;
import org.vtb.multibanking.model.quest.QuestStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserQuestRepository extends MongoRepository<UserQuestEntity, String> {
    List<UserQuestEntity> findByUserIdAndStatus(String userId, QuestStatus status);
    Optional<UserQuestEntity> findByUserIdAndQuestId(String userId, String questId);
    List<UserQuestEntity> findByUserId(String userId);
}
