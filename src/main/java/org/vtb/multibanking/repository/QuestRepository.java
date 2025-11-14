package org.vtb.multibanking.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import org.vtb.multibanking.entity.quest.QuestEntity;
import org.vtb.multibanking.model.quest.QuestStatus;
import org.vtb.multibanking.model.quest.QuestType;
import org.vtb.multibanking.model.quest.SubscriptionTier;

import java.time.Instant;
import java.util.List;

@Repository
public interface QuestRepository extends MongoRepository<QuestEntity, String> {
    List<QuestEntity> findByRequiredTierAndStatus(SubscriptionTier tier, QuestStatus status);

    @Query("{ '$and': [ " +
            "{ 'status': ?1 }, " +
            "{ '$or': [ { 'requiredTier': ?0 }, { 'requiredTier': 'FREE' } ] }, " +
            "{ 'startDate': { '$lte': ?2 } }, " +
            "{ 'endDate': { '$gte': ?3 } } " +
            "] }")
    List<QuestEntity> findAvailableQuests(
            SubscriptionTier tier,
            QuestStatus status,
            Instant now,
            Instant nowAgain
    );

}
