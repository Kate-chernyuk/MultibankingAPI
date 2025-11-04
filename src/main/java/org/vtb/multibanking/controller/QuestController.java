package org.vtb.multibanking.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.vtb.multibanking.entity.quest.QuestEntity;
import org.vtb.multibanking.entity.quest.UserProfileEntity;
import org.vtb.multibanking.entity.quest.UserQuestEntity;
import org.vtb.multibanking.service.quest.QuestEngineService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/quests")
@RequiredArgsConstructor
@Slf4j
public class QuestController {

    private final QuestEngineService questEngineService;

    @GetMapping("/{userId}/available")
    public ResponseEntity<List<QuestEntity>> getAvailableQuests(@PathVariable String userId) {
        try {
            List<QuestEntity> quests = questEngineService.getAvailableQuests(userId);
            return ResponseEntity.ok(quests);
        } catch (Exception e) {
            log.error("Не удалось раздобыть доступные юзеру {} квесты: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{userId}/assign/{questId}")
    public ResponseEntity<UserQuestEntity> assignQuest(
            @PathVariable String userId,
            @PathVariable String questId
    ) {
        try
        {
            UserQuestEntity userQuest = questEngineService.assignQuest(userId, questId);
            return ResponseEntity.ok(userQuest);
        } catch (Exception e) {
            log.error("Error assigning quest to user: {}, quest: {}", userId, questId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{userId}/profile")
    public ResponseEntity<UserProfileEntity> getUserProfile(@PathVariable String userId) {
        try {
            UserProfileEntity profile = questEngineService.getUserProfileWithStats(userId);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            log.error("Ошибка получения профиля юзера {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("{userId}/dashboard")
    public ResponseEntity<Map<String, Object>> getQuestDashboard(@PathVariable String userId) {
        try {
            UserProfileEntity profile = questEngineService.getUserProfileWithStats(userId);
            List<QuestEntity> availableQuests = questEngineService.getAvailableQuests(userId);

            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("userProfile", profile);
            dashboard.put("availableQuests", availableQuests);
            dashboard.put("levelProgress", calculateLevelProgress(profile.getActivityPoints()));

            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            log.error("Ошибка при создании дашборда квестов юзера {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    private Map<String, Object> calculateLevelProgress(Integer points) {
        Map<String, Object> progress = new HashMap<>();

        if (points < 50) {
            progress.put("currentLevel", 1);
            progress.put("nextLevel", 2);
            progress.put("progress", (points * 100) / 50);
            progress.put("pointsToNext", 50 - points);
        } else if (points < 100) {
            progress.put("currentLevel", 2);
            progress.put("nextLevel", 3);
            progress.put("progress", ((points - 50) * 100) / 50);
            progress.put("pointsToNext", 100 - points);
        } else {
            progress.put("currentLevel", 3);
            progress.put("nextLevel", 3);
            progress.put("progress", 100);
            progress.put("pointsToNext", 0);
        }

        return progress;
    }
}
