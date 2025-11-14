package org.vtb.multibanking.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.vtb.multibanking.model.BankType;
import org.vtb.multibanking.model.Card;
import org.vtb.multibanking.service.bank.BankService;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/cards")
@RequiredArgsConstructor
public class CardController {

    private final BankService bankService;

    @GetMapping("/{clientId}")
    public ResponseEntity<Map<String, Object>> getCards(
            @PathVariable String clientId,
            @RequestParam(required = false) String bankType,
            @RequestParam(required = false) String cardType,
            @RequestParam(required = false) String status
    ) {
        try {
            List<Card> allCards = new ArrayList<>();

            if (bankType != null && !bankType.isEmpty()) {
                try {
                    BankType type = BankType.valueOf(bankType.toUpperCase());
                    List<Card> bankCards = bankService.getBankClient(type).getCards();
                    allCards.addAll(processCards(bankCards));
                } catch (IllegalArgumentException e) {
                    log.warn("Неверный тип банка: {}", bankType);
                    return ResponseEntity.badRequest().body(Map.of(
                            "success", false,
                            "error", "Неверный тип банка: " + bankType
                    ));
                }
            } else {
                for (BankType type : BankType.values()) {
                    try {
                        List<Card> bankCards = bankService.getBankClient(type).getCards();
                        allCards.addAll(processCards(bankCards));
                    } catch (Exception e) {
                        log.warn("Не удалось получить карты банка {}: {}", type, e.getMessage());
                    }
                }
            }

            // Фильтрация по типу карты
            if (cardType != null && !cardType.isEmpty()) {
                allCards = allCards.stream()
                        .filter(card -> card.getCardType() != null && card.getCardType().equalsIgnoreCase(cardType))
                        .toList();
            }

            // Фильтрация по статусу
            if (status != null && !status.isEmpty()) {
                allCards = allCards.stream()
                        .filter(card -> card.getStatus() != null && card.getStatus().equalsIgnoreCase(status))
                        .toList();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("cards", allCards);
            response.put("client", clientId);
            response.put("count", allCards.size());
            response.put("timestamp", new Date());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Ошибка получения списка карт: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/{clientId}/{cardId}")
    public ResponseEntity<Map<String, Object>> getCardDetails(
            @PathVariable String clientId,
            @PathVariable String cardId
    ) {
        try {
            Card card = null;
            BankType foundBankType = null;

            for (BankType bankType : BankType.values()) {
                try {
                    List<Card> bankCards = bankService.getBankClient(bankType).getCards();
                    Optional<Card> foundCard = bankCards.stream()
                            .filter(c -> cardId.equals(c.getCardId()))
                            .findFirst();

                    if (foundCard.isPresent()) {
                        card = foundCard.get();
                        foundBankType = bankType;
                        break;
                    }
                } catch (Exception e) {
                    log.warn("Не удалось получить карты банка {}: {}", bankType, e.getMessage());
                }
            }

            if (card == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Карта не найдена"
                ));
            }

            card = processCard(card);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("card", card);
            response.put("bankType", foundBankType);
            response.put("client", clientId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Ошибка получения деталей карты: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/{clientId}/create")
    public ResponseEntity<Map<String, Object>> createCard(
            @PathVariable String clientId,
            @RequestBody Map<String, Object> requestBody
    ) {
        try {
            BankType bankType = BankType.valueOf(((String) requestBody.get("bankType")).toUpperCase());
            String accountNumber = (String) requestBody.get("accountNumber");
            String cardType = (String) requestBody.get("cardType");
            String cardName = (String) requestBody.get("cardName");

            if (accountNumber == null || accountNumber.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Не указан номер счета"
                ));
            }

            Card newCard = bankService.getBankClient(bankType).createCard(accountNumber, cardType, cardName);

            if (newCard == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Не удалось создать карту"
                ));
            }

            newCard = processCard(newCard);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Карта успешно выпущена");
            response.put("card", newCard);
            response.put("client", clientId);

            log.info("Клиент {} успешно выпустил карту {} в банке {}", clientId, newCard.getCardId(), bankType);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("Неверный тип банка: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Неверный тип банка: " + e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Ошибка выпуска карты для клиента {}: {}", clientId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Ошибка выпуска карты: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{clientId}/{cardId}")
    public ResponseEntity<Map<String, Object>> deleteCard(
            @PathVariable String clientId,
            @PathVariable String cardId
    ) {
        try {
            boolean success = false;
            BankType foundBankType = null;

            // Ищем карту во всех банках и удаляем
            for (BankType bankType : BankType.values()) {
                try {
                    List<Card> bankCards = bankService.getBankClient(bankType).getCards();
                    Optional<Card> foundCard = bankCards.stream()
                            .filter(c -> cardId.equals(c.getCardId()))
                            .findFirst();

                    if (foundCard.isPresent()) {
                        success = bankService.getBankClient(bankType).deleteCard(cardId);
                        foundBankType = bankType;
                        break;
                    }
                } catch (Exception e) {
                    log.warn("Не удалось получить карты банка {}: {}", bankType, e.getMessage());
                }
            }

            Map<String, Object> response = new HashMap<>();
            if (success) {
                response.put("success", true);
                response.put("message", "Карта успешно удалена");
                response.put("cardId", cardId);
                response.put("bankType", foundBankType);
                response.put("client", clientId);
                log.info("Клиент {} успешно удалил карту {} из банка {}", clientId, cardId, foundBankType);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("error", "Не удалось удалить карту или карта не найдена");
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Ошибка удаления карты {}: {}", cardId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Ошибка удаления карты: " + e.getMessage()
            ));
        }
    }

    private List<Card> processCards(List<Card> cards) {
        if (cards == null) return new ArrayList<>();

        return cards.stream()
                .map(this::processCard)
                .filter(Objects::nonNull)
                .toList();
    }

    private Card processCard(Card card) {
        if (card == null) return null;

        if (card.getCardId() == null) card.setCardId("unknown");
        if (card.getCardNumber() == null) card.setCardNumber("N/A");
        if (card.getCardName() == null) card.setCardName("Безымянная карта");
        if (card.getCardType() == null) card.setCardType("debit");
        if (card.getStatus() == null) card.setStatus("unknown");
        if (card.getAccountNumber() == null) card.setAccountNumber("N/A");
        if (card.getBankType() == null) card.setBankType(BankType.VBANK);

        return card;
    }
}