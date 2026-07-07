package com.klassa.attendance;

import com.klassa.attendance.dto.AttendanceResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface AttendanceMapper {

    @Mapping(target = "enrollmentId", source = "enrollment.id")
    @Mapping(target = "studentName",
             expression = "java(record.getEnrollment().getStudent().fullName())")
    @Mapping(target = "registeredById", source = "registeredBy.id")
    AttendanceResponse toResponse(AttendanceRecord record);
}
