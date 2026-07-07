package com.klassa.student;

import com.klassa.student.dto.FamilyResponse;
import com.klassa.student.dto.StudentResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface StudentMapper {

    @Mapping(target = "fullName", expression = "java(student.fullName())")
    @Mapping(target = "familyId", source = "family.id")
    @Mapping(target = "guardianName", source = "family.guardianName")
    StudentResponse toResponse(Student student);

    FamilyResponse toFamilyResponse(Family family);
}
