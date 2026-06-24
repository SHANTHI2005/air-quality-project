package com.airquality.api;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.List;

// this tells Spring "this class handles incoming web requests"
@RestController
@RequestMapping("/api/air-quality")
@CrossOrigin(origins = "*")  // allows our React frontend to call this API
public class AirQualityController {

    // Spring automatically gives us the repository we need
    private final AirQualityRepository repository;

    public AirQualityController(AirQualityRepository repository) {
        this.repository = repository;
    }

    // endpoint 1: get ALL readings
    // when someone calls GET /api/air-quality — return everything
    @GetMapping
    public List<AirQualityReading> getAllReadings() {
        return repository.findAll();
    }

    // endpoint 2: get only the 10 most recent readings
    // when someone calls GET /api/air-quality/recent
    @GetMapping("/recent")
    public List<AirQualityReading> getRecentReadings() {
        return repository.findTop10ByOrderByTimestampDesc();
    }

    // endpoint 3: get one reading by its id number
    // when someone calls GET /api/air-quality/1
    @GetMapping("/{id}")
    public ResponseEntity<AirQualityReading> getById(@PathVariable Long id) {
        return repository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}