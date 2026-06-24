package com.airquality.api;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

// this interface gives us database query powers for free
// we get findAll, findById, save, delete etc without writing any SQL
@Repository
public interface AirQualityRepository extends JpaRepository<AirQualityReading, Long> {

    // get the 10 most recent readings
    // Spring reads the method name and figures out the SQL automatically!
    List<AirQualityReading> findTop10ByOrderByTimestampDesc();

}
