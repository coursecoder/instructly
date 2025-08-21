import { z } from 'zod';
export declare const userPreferencesSchema: z.ZodObject<{
    defaultAudience: z.ZodString;
    preferredComplexity: z.ZodEnum<["beginner", "intermediate", "advanced"]>;
    accessibilityStrictness: z.ZodEnum<["standard", "strict"]>;
    aiGenerationStyle: z.ZodEnum<["concise", "detailed", "comprehensive"]>;
}, "strip", z.ZodTypeAny, {
    defaultAudience: string;
    preferredComplexity: "beginner" | "intermediate" | "advanced";
    accessibilityStrictness: "standard" | "strict";
    aiGenerationStyle: "concise" | "detailed" | "comprehensive";
}, {
    defaultAudience: string;
    preferredComplexity: "beginner" | "intermediate" | "advanced";
    accessibilityStrictness: "standard" | "strict";
    aiGenerationStyle: "concise" | "detailed" | "comprehensive";
}>;
export declare const userSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    organization: z.ZodOptional<z.ZodString>;
    role: z.ZodEnum<["designer", "manager", "admin"]>;
    preferences: z.ZodObject<{
        defaultAudience: z.ZodString;
        preferredComplexity: z.ZodEnum<["beginner", "intermediate", "advanced"]>;
        accessibilityStrictness: z.ZodEnum<["standard", "strict"]>;
        aiGenerationStyle: z.ZodEnum<["concise", "detailed", "comprehensive"]>;
    }, "strip", z.ZodTypeAny, {
        defaultAudience: string;
        preferredComplexity: "beginner" | "intermediate" | "advanced";
        accessibilityStrictness: "standard" | "strict";
        aiGenerationStyle: "concise" | "detailed" | "comprehensive";
    }, {
        defaultAudience: string;
        preferredComplexity: "beginner" | "intermediate" | "advanced";
        accessibilityStrictness: "standard" | "strict";
        aiGenerationStyle: "concise" | "detailed" | "comprehensive";
    }>;
    createdAt: z.ZodDate;
    lastLoginAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    name: string;
    role: "designer" | "manager" | "admin";
    preferences: {
        defaultAudience: string;
        preferredComplexity: "beginner" | "intermediate" | "advanced";
        accessibilityStrictness: "standard" | "strict";
        aiGenerationStyle: "concise" | "detailed" | "comprehensive";
    };
    createdAt: Date;
    organization?: string | undefined;
    lastLoginAt?: Date | undefined;
}, {
    id: string;
    email: string;
    name: string;
    role: "designer" | "manager" | "admin";
    preferences: {
        defaultAudience: string;
        preferredComplexity: "beginner" | "intermediate" | "advanced";
        accessibilityStrictness: "standard" | "strict";
        aiGenerationStyle: "concise" | "detailed" | "comprehensive";
    };
    createdAt: Date;
    organization?: string | undefined;
    lastLoginAt?: Date | undefined;
}>;
export declare const brandingConfigSchema: z.ZodObject<{
    primaryColor: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodString>;
    organizationName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    primaryColor?: string | undefined;
    logoUrl?: string | undefined;
    organizationName?: string | undefined;
}, {
    primaryColor?: string | undefined;
    logoUrl?: string | undefined;
    organizationName?: string | undefined;
}>;
export declare const projectSettingsSchema: z.ZodObject<{
    brandingOptions: z.ZodObject<{
        primaryColor: z.ZodOptional<z.ZodString>;
        logoUrl: z.ZodOptional<z.ZodString>;
        organizationName: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        primaryColor?: string | undefined;
        logoUrl?: string | undefined;
        organizationName?: string | undefined;
    }, {
        primaryColor?: string | undefined;
        logoUrl?: string | undefined;
        organizationName?: string | undefined;
    }>;
    defaultAccessibilityLevel: z.ZodEnum<["AA", "AAA"]>;
    approvalWorkflow: z.ZodBoolean;
    stakeholderAccess: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    brandingOptions: {
        primaryColor?: string | undefined;
        logoUrl?: string | undefined;
        organizationName?: string | undefined;
    };
    defaultAccessibilityLevel: "AA" | "AAA";
    approvalWorkflow: boolean;
    stakeholderAccess: boolean;
}, {
    brandingOptions: {
        primaryColor?: string | undefined;
        logoUrl?: string | undefined;
        organizationName?: string | undefined;
    };
    defaultAccessibilityLevel: "AA" | "AAA";
    approvalWorkflow: boolean;
    stakeholderAccess: boolean;
}>;
export declare const projectSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    targetAudience: z.ZodString;
    estimatedDuration: z.ZodNumber;
    status: z.ZodEnum<["draft", "in_progress", "review", "completed", "archived"]>;
    ownerId: z.ZodString;
    collaborators: z.ZodArray<z.ZodString, "many">;
    settings: z.ZodObject<{
        brandingOptions: z.ZodObject<{
            primaryColor: z.ZodOptional<z.ZodString>;
            logoUrl: z.ZodOptional<z.ZodString>;
            organizationName: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        }, {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        }>;
        defaultAccessibilityLevel: z.ZodEnum<["AA", "AAA"]>;
        approvalWorkflow: z.ZodBoolean;
        stakeholderAccess: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        brandingOptions: {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        };
        defaultAccessibilityLevel: "AA" | "AAA";
        approvalWorkflow: boolean;
        stakeholderAccess: boolean;
    }, {
        brandingOptions: {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        };
        defaultAccessibilityLevel: "AA" | "AAA";
        approvalWorkflow: boolean;
        stakeholderAccess: boolean;
    }>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "in_progress" | "review" | "completed" | "archived";
    id: string;
    createdAt: Date;
    title: string;
    description: string;
    targetAudience: string;
    estimatedDuration: number;
    ownerId: string;
    collaborators: string[];
    settings: {
        brandingOptions: {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        };
        defaultAccessibilityLevel: "AA" | "AAA";
        approvalWorkflow: boolean;
        stakeholderAccess: boolean;
    };
    updatedAt: Date;
}, {
    status: "draft" | "in_progress" | "review" | "completed" | "archived";
    id: string;
    createdAt: Date;
    title: string;
    description: string;
    targetAudience: string;
    estimatedDuration: number;
    ownerId: string;
    collaborators: string[];
    settings: {
        brandingOptions: {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        };
        defaultAccessibilityLevel: "AA" | "AAA";
        approvalWorkflow: boolean;
        stakeholderAccess: boolean;
    };
    updatedAt: Date;
}>;
export declare const instructionalDesignAnalysisSchema: z.ZodObject<{
    contentType: z.ZodString;
    rationale: z.ZodString;
    recommendedMethods: z.ZodArray<z.ZodString, "many">;
    confidence: z.ZodNumber;
    modelUsed: z.ZodEnum<["gpt-5", "gpt-3.5-turbo"]>;
}, "strip", z.ZodTypeAny, {
    contentType: string;
    rationale: string;
    recommendedMethods: string[];
    confidence: number;
    modelUsed: "gpt-5" | "gpt-3.5-turbo";
}, {
    contentType: string;
    rationale: string;
    recommendedMethods: string[];
    confidence: number;
    modelUsed: "gpt-5" | "gpt-3.5-turbo";
}>;
export declare const topicSchema: z.ZodObject<{
    id: z.ZodString;
    content: z.ZodString;
    classification: z.ZodEnum<["facts", "concepts", "processes", "procedures", "principles"]>;
    aiAnalysis: z.ZodObject<{
        contentType: z.ZodString;
        rationale: z.ZodString;
        recommendedMethods: z.ZodArray<z.ZodString, "many">;
        confidence: z.ZodNumber;
        modelUsed: z.ZodEnum<["gpt-5", "gpt-3.5-turbo"]>;
    }, "strip", z.ZodTypeAny, {
        contentType: string;
        rationale: string;
        recommendedMethods: string[];
        confidence: number;
        modelUsed: "gpt-5" | "gpt-3.5-turbo";
    }, {
        contentType: string;
        rationale: string;
        recommendedMethods: string[];
        confidence: number;
        modelUsed: "gpt-5" | "gpt-3.5-turbo";
    }>;
    generatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    content: string;
    classification: "facts" | "concepts" | "processes" | "procedures" | "principles";
    aiAnalysis: {
        contentType: string;
        rationale: string;
        recommendedMethods: string[];
        confidence: number;
        modelUsed: "gpt-5" | "gpt-3.5-turbo";
    };
    generatedAt: Date;
}, {
    id: string;
    content: string;
    classification: "facts" | "concepts" | "processes" | "procedures" | "principles";
    aiAnalysis: {
        contentType: string;
        rationale: string;
        recommendedMethods: string[];
        confidence: number;
        modelUsed: "gpt-5" | "gpt-3.5-turbo";
    };
    generatedAt: Date;
}>;
export declare const topicAnalysisRequestSchema: z.ZodObject<{
    topics: z.ZodArray<z.ZodString, "many">;
    analysisType: z.ZodDefault<z.ZodEnum<["instructional_design", "bloom_taxonomy", "instructional_methods"]>>;
}, "strip", z.ZodTypeAny, {
    topics: string[];
    analysisType: "instructional_design" | "bloom_taxonomy" | "instructional_methods";
}, {
    topics: string[];
    analysisType?: "instructional_design" | "bloom_taxonomy" | "instructional_methods" | undefined;
}>;
export declare const topicAnalysisResponseSchema: z.ZodObject<{
    topics: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        content: z.ZodString;
        classification: z.ZodEnum<["facts", "concepts", "processes", "procedures", "principles"]>;
        aiAnalysis: z.ZodObject<{
            contentType: z.ZodString;
            rationale: z.ZodString;
            recommendedMethods: z.ZodArray<z.ZodString, "many">;
            confidence: z.ZodNumber;
            modelUsed: z.ZodEnum<["gpt-5", "gpt-3.5-turbo"]>;
        }, "strip", z.ZodTypeAny, {
            contentType: string;
            rationale: string;
            recommendedMethods: string[];
            confidence: number;
            modelUsed: "gpt-5" | "gpt-3.5-turbo";
        }, {
            contentType: string;
            rationale: string;
            recommendedMethods: string[];
            confidence: number;
            modelUsed: "gpt-5" | "gpt-3.5-turbo";
        }>;
        generatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        id: string;
        content: string;
        classification: "facts" | "concepts" | "processes" | "procedures" | "principles";
        aiAnalysis: {
            contentType: string;
            rationale: string;
            recommendedMethods: string[];
            confidence: number;
            modelUsed: "gpt-5" | "gpt-3.5-turbo";
        };
        generatedAt: Date;
    }, {
        id: string;
        content: string;
        classification: "facts" | "concepts" | "processes" | "procedures" | "principles";
        aiAnalysis: {
            contentType: string;
            rationale: string;
            recommendedMethods: string[];
            confidence: number;
            modelUsed: "gpt-5" | "gpt-3.5-turbo";
        };
        generatedAt: Date;
    }>, "many">;
    totalCost: z.ZodNumber;
    processingTime: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    topics: {
        id: string;
        content: string;
        classification: "facts" | "concepts" | "processes" | "procedures" | "principles";
        aiAnalysis: {
            contentType: string;
            rationale: string;
            recommendedMethods: string[];
            confidence: number;
            modelUsed: "gpt-5" | "gpt-3.5-turbo";
        };
        generatedAt: Date;
    }[];
    totalCost: number;
    processingTime: number;
}, {
    topics: {
        id: string;
        content: string;
        classification: "facts" | "concepts" | "processes" | "procedures" | "principles";
        aiAnalysis: {
            contentType: string;
            rationale: string;
            recommendedMethods: string[];
            confidence: number;
            modelUsed: "gpt-5" | "gpt-3.5-turbo";
        };
        generatedAt: Date;
    }[];
    totalCost: number;
    processingTime: number;
}>;
export declare const lessonActivitySchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["presentation", "discussion", "exercise", "case_study", "role_play"]>;
    title: z.ZodString;
    description: z.ZodString;
    duration: z.ZodNumber;
    materials: z.ZodArray<z.ZodString, "many">;
    instructions: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "presentation" | "discussion" | "exercise" | "case_study" | "role_play";
    id: string;
    title: string;
    description: string;
    duration: number;
    materials: string[];
    instructions: string;
}, {
    type: "presentation" | "discussion" | "exercise" | "case_study" | "role_play";
    id: string;
    title: string;
    description: string;
    duration: number;
    materials: string[];
    instructions: string;
}>;
export declare const assessmentSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["quiz", "assignment", "practical", "peer_review"]>;
    title: z.ZodString;
    description: z.ZodString;
    criteria: z.ZodArray<z.ZodString, "many">;
    passingScore: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "quiz" | "assignment" | "practical" | "peer_review";
    id: string;
    title: string;
    description: string;
    criteria: string[];
    passingScore?: number | undefined;
}, {
    type: "quiz" | "assignment" | "practical" | "peer_review";
    id: string;
    title: string;
    description: string;
    criteria: string[];
    passingScore?: number | undefined;
}>;
export declare const professionalDocSchema: z.ZodObject<{
    facilitatorGuide: z.ZodOptional<z.ZodString>;
    participantWorkbook: z.ZodOptional<z.ZodString>;
    slideDeck: z.ZodOptional<z.ZodString>;
    handouts: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    handouts: string[];
    facilitatorGuide?: string | undefined;
    participantWorkbook?: string | undefined;
    slideDeck?: string | undefined;
}, {
    handouts: string[];
    facilitatorGuide?: string | undefined;
    participantWorkbook?: string | undefined;
    slideDeck?: string | undefined;
}>;
export declare const generationMetadataSchema: z.ZodObject<{
    modelUsed: z.ZodEnum<["gpt-5", "gpt-3.5-turbo"]>;
    generationTime: z.ZodDate;
    costUsd: z.ZodNumber;
    tokenCount: z.ZodNumber;
    version: z.ZodString;
}, "strip", z.ZodTypeAny, {
    modelUsed: "gpt-5" | "gpt-3.5-turbo";
    generationTime: Date;
    costUsd: number;
    tokenCount: number;
    version: string;
}, {
    modelUsed: "gpt-5" | "gpt-3.5-turbo";
    generationTime: Date;
    costUsd: number;
    tokenCount: number;
    version: string;
}>;
export declare const accessibilityFeatureSchema: z.ZodObject<{
    type: z.ZodEnum<["alt_text", "captions", "transcript", "keyboard_nav", "screen_reader"]>;
    description: z.ZodString;
    implemented: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    type: "alt_text" | "captions" | "transcript" | "keyboard_nav" | "screen_reader";
    description: string;
    implemented: boolean;
}, {
    type: "alt_text" | "captions" | "transcript" | "keyboard_nav" | "screen_reader";
    description: string;
    implemented: boolean;
}>;
export declare const lessonContentSchema: z.ZodObject<{
    learningObjectives: z.ZodArray<z.ZodString, "many">;
    activities: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["presentation", "discussion", "exercise", "case_study", "role_play"]>;
        title: z.ZodString;
        description: z.ZodString;
        duration: z.ZodNumber;
        materials: z.ZodArray<z.ZodString, "many">;
        instructions: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "presentation" | "discussion" | "exercise" | "case_study" | "role_play";
        id: string;
        title: string;
        description: string;
        duration: number;
        materials: string[];
        instructions: string;
    }, {
        type: "presentation" | "discussion" | "exercise" | "case_study" | "role_play";
        id: string;
        title: string;
        description: string;
        duration: number;
        materials: string[];
        instructions: string;
    }>, "many">;
    assessments: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["quiz", "assignment", "practical", "peer_review"]>;
        title: z.ZodString;
        description: z.ZodString;
        criteria: z.ZodArray<z.ZodString, "many">;
        passingScore: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "quiz" | "assignment" | "practical" | "peer_review";
        id: string;
        title: string;
        description: string;
        criteria: string[];
        passingScore?: number | undefined;
    }, {
        type: "quiz" | "assignment" | "practical" | "peer_review";
        id: string;
        title: string;
        description: string;
        criteria: string[];
        passingScore?: number | undefined;
    }>, "many">;
    instructorNotes: z.ZodString;
    participantMaterials: z.ZodString;
    professionalDocumentation: z.ZodObject<{
        facilitatorGuide: z.ZodOptional<z.ZodString>;
        participantWorkbook: z.ZodOptional<z.ZodString>;
        slideDeck: z.ZodOptional<z.ZodString>;
        handouts: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        handouts: string[];
        facilitatorGuide?: string | undefined;
        participantWorkbook?: string | undefined;
        slideDeck?: string | undefined;
    }, {
        handouts: string[];
        facilitatorGuide?: string | undefined;
        participantWorkbook?: string | undefined;
        slideDeck?: string | undefined;
    }>;
    generationMetadata: z.ZodObject<{
        modelUsed: z.ZodEnum<["gpt-5", "gpt-3.5-turbo"]>;
        generationTime: z.ZodDate;
        costUsd: z.ZodNumber;
        tokenCount: z.ZodNumber;
        version: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        modelUsed: "gpt-5" | "gpt-3.5-turbo";
        generationTime: Date;
        costUsd: number;
        tokenCount: number;
        version: string;
    }, {
        modelUsed: "gpt-5" | "gpt-3.5-turbo";
        generationTime: Date;
        costUsd: number;
        tokenCount: number;
        version: string;
    }>;
    accessibilityFeatures: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["alt_text", "captions", "transcript", "keyboard_nav", "screen_reader"]>;
        description: z.ZodString;
        implemented: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        type: "alt_text" | "captions" | "transcript" | "keyboard_nav" | "screen_reader";
        description: string;
        implemented: boolean;
    }, {
        type: "alt_text" | "captions" | "transcript" | "keyboard_nav" | "screen_reader";
        description: string;
        implemented: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    learningObjectives: string[];
    activities: {
        type: "presentation" | "discussion" | "exercise" | "case_study" | "role_play";
        id: string;
        title: string;
        description: string;
        duration: number;
        materials: string[];
        instructions: string;
    }[];
    assessments: {
        type: "quiz" | "assignment" | "practical" | "peer_review";
        id: string;
        title: string;
        description: string;
        criteria: string[];
        passingScore?: number | undefined;
    }[];
    instructorNotes: string;
    participantMaterials: string;
    professionalDocumentation: {
        handouts: string[];
        facilitatorGuide?: string | undefined;
        participantWorkbook?: string | undefined;
        slideDeck?: string | undefined;
    };
    generationMetadata: {
        modelUsed: "gpt-5" | "gpt-3.5-turbo";
        generationTime: Date;
        costUsd: number;
        tokenCount: number;
        version: string;
    };
    accessibilityFeatures: {
        type: "alt_text" | "captions" | "transcript" | "keyboard_nav" | "screen_reader";
        description: string;
        implemented: boolean;
    }[];
}, {
    learningObjectives: string[];
    activities: {
        type: "presentation" | "discussion" | "exercise" | "case_study" | "role_play";
        id: string;
        title: string;
        description: string;
        duration: number;
        materials: string[];
        instructions: string;
    }[];
    assessments: {
        type: "quiz" | "assignment" | "practical" | "peer_review";
        id: string;
        title: string;
        description: string;
        criteria: string[];
        passingScore?: number | undefined;
    }[];
    instructorNotes: string;
    participantMaterials: string;
    professionalDocumentation: {
        handouts: string[];
        facilitatorGuide?: string | undefined;
        participantWorkbook?: string | undefined;
        slideDeck?: string | undefined;
    };
    generationMetadata: {
        modelUsed: "gpt-5" | "gpt-3.5-turbo";
        generationTime: Date;
        costUsd: number;
        tokenCount: number;
        version: string;
    };
    accessibilityFeatures: {
        type: "alt_text" | "captions" | "transcript" | "keyboard_nav" | "screen_reader";
        description: string;
        implemented: boolean;
    }[];
}>;
export declare const auditEntrySchema: z.ZodObject<{
    timestamp: z.ZodDate;
    action: z.ZodString;
    userId: z.ZodString;
    details: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    timestamp: Date;
    action: string;
    userId: string;
    details: Record<string, any>;
}, {
    timestamp: Date;
    action: string;
    userId: string;
    details: Record<string, any>;
}>;
export declare const accessibilityViolationSchema: z.ZodObject<{
    id: z.ZodString;
    severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
    guideline: z.ZodString;
    description: z.ZodString;
    location: z.ZodString;
    remediation: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    guideline: string;
    location: string;
    remediation: string;
}, {
    id: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    guideline: string;
    location: string;
    remediation: string;
}>;
export declare const accessibilityStatusSchema: z.ZodObject<{
    complianceLevel: z.ZodEnum<["A", "AA", "AAA"]>;
    overallScore: z.ZodNumber;
    violations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
        guideline: z.ZodString;
        description: z.ZodString;
        location: z.ZodString;
        remediation: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        description: string;
        severity: "low" | "medium" | "high" | "critical";
        guideline: string;
        location: string;
        remediation: string;
    }, {
        id: string;
        description: string;
        severity: "low" | "medium" | "high" | "critical";
        guideline: string;
        location: string;
        remediation: string;
    }>, "many">;
    recommendations: z.ZodArray<z.ZodString, "many">;
    auditTrail: z.ZodArray<z.ZodObject<{
        timestamp: z.ZodDate;
        action: z.ZodString;
        userId: z.ZodString;
        details: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        timestamp: Date;
        action: string;
        userId: string;
        details: Record<string, any>;
    }, {
        timestamp: Date;
        action: string;
        userId: string;
        details: Record<string, any>;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    complianceLevel: "AA" | "AAA" | "A";
    overallScore: number;
    violations: {
        id: string;
        description: string;
        severity: "low" | "medium" | "high" | "critical";
        guideline: string;
        location: string;
        remediation: string;
    }[];
    recommendations: string[];
    auditTrail: {
        timestamp: Date;
        action: string;
        userId: string;
        details: Record<string, any>;
    }[];
}, {
    complianceLevel: "AA" | "AAA" | "A";
    overallScore: number;
    violations: {
        id: string;
        description: string;
        severity: "low" | "medium" | "high" | "critical";
        guideline: string;
        location: string;
        remediation: string;
    }[];
    recommendations: string[];
    auditTrail: {
        timestamp: Date;
        action: string;
        userId: string;
        details: Record<string, any>;
    }[];
}>;
export declare const lessonSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    projectId: z.ZodString;
    topics: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        content: z.ZodString;
        classification: z.ZodEnum<["facts", "concepts", "processes", "procedures", "principles"]>;
        aiAnalysis: z.ZodObject<{
            contentType: z.ZodString;
            rationale: z.ZodString;
            recommendedMethods: z.ZodArray<z.ZodString, "many">;
            confidence: z.ZodNumber;
            modelUsed: z.ZodEnum<["gpt-5", "gpt-3.5-turbo"]>;
        }, "strip", z.ZodTypeAny, {
            contentType: string;
            rationale: string;
            recommendedMethods: string[];
            confidence: number;
            modelUsed: "gpt-5" | "gpt-3.5-turbo";
        }, {
            contentType: string;
            rationale: string;
            recommendedMethods: string[];
            confidence: number;
            modelUsed: "gpt-5" | "gpt-3.5-turbo";
        }>;
        generatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        id: string;
        content: string;
        classification: "facts" | "concepts" | "processes" | "procedures" | "principles";
        aiAnalysis: {
            contentType: string;
            rationale: string;
            recommendedMethods: string[];
            confidence: number;
            modelUsed: "gpt-5" | "gpt-3.5-turbo";
        };
        generatedAt: Date;
    }, {
        id: string;
        content: string;
        classification: "facts" | "concepts" | "processes" | "procedures" | "principles";
        aiAnalysis: {
            contentType: string;
            rationale: string;
            recommendedMethods: string[];
            confidence: number;
            modelUsed: "gpt-5" | "gpt-3.5-turbo";
        };
        generatedAt: Date;
    }>, "many">;
    generatedContent: z.ZodOptional<z.ZodObject<{
        learningObjectives: z.ZodArray<z.ZodString, "many">;
        activities: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodEnum<["presentation", "discussion", "exercise", "case_study", "role_play"]>;
            title: z.ZodString;
            description: z.ZodString;
            duration: z.ZodNumber;
            materials: z.ZodArray<z.ZodString, "many">;
            instructions: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "presentation" | "discussion" | "exercise" | "case_study" | "role_play";
            id: string;
            title: string;
            description: string;
            duration: number;
            materials: string[];
            instructions: string;
        }, {
            type: "presentation" | "discussion" | "exercise" | "case_study" | "role_play";
            id: string;
            title: string;
            description: string;
            duration: number;
            materials: string[];
            instructions: string;
        }>, "many">;
        assessments: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodEnum<["quiz", "assignment", "practical", "peer_review"]>;
            title: z.ZodString;
            description: z.ZodString;
            criteria: z.ZodArray<z.ZodString, "many">;
            passingScore: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "quiz" | "assignment" | "practical" | "peer_review";
            id: string;
            title: string;
            description: string;
            criteria: string[];
            passingScore?: number | undefined;
        }, {
            type: "quiz" | "assignment" | "practical" | "peer_review";
            id: string;
            title: string;
            description: string;
            criteria: string[];
            passingScore?: number | undefined;
        }>, "many">;
        instructorNotes: z.ZodString;
        participantMaterials: z.ZodString;
        professionalDocumentation: z.ZodObject<{
            facilitatorGuide: z.ZodOptional<z.ZodString>;
            participantWorkbook: z.ZodOptional<z.ZodString>;
            slideDeck: z.ZodOptional<z.ZodString>;
            handouts: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            handouts: string[];
            facilitatorGuide?: string | undefined;
            participantWorkbook?: string | undefined;
            slideDeck?: string | undefined;
        }, {
            handouts: string[];
            facilitatorGuide?: string | undefined;
            participantWorkbook?: string | undefined;
            slideDeck?: string | undefined;
        }>;
        generationMetadata: z.ZodObject<{
            modelUsed: z.ZodEnum<["gpt-5", "gpt-3.5-turbo"]>;
            generationTime: z.ZodDate;
            costUsd: z.ZodNumber;
            tokenCount: z.ZodNumber;
            version: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            modelUsed: "gpt-5" | "gpt-3.5-turbo";
            generationTime: Date;
            costUsd: number;
            tokenCount: number;
            version: string;
        }, {
            modelUsed: "gpt-5" | "gpt-3.5-turbo";
            generationTime: Date;
            costUsd: number;
            tokenCount: number;
            version: string;
        }>;
        accessibilityFeatures: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["alt_text", "captions", "transcript", "keyboard_nav", "screen_reader"]>;
            description: z.ZodString;
            implemented: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            type: "alt_text" | "captions" | "transcript" | "keyboard_nav" | "screen_reader";
            description: string;
            implemented: boolean;
        }, {
            type: "alt_text" | "captions" | "transcript" | "keyboard_nav" | "screen_reader";
            description: string;
            implemented: boolean;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        learningObjectives: string[];
        activities: {
            type: "presentation" | "discussion" | "exercise" | "case_study" | "role_play";
            id: string;
            title: string;
            description: string;
            duration: number;
            materials: string[];
            instructions: string;
        }[];
        assessments: {
            type: "quiz" | "assignment" | "practical" | "peer_review";
            id: string;
            title: string;
            description: string;
            criteria: string[];
            passingScore?: number | undefined;
        }[];
        instructorNotes: string;
        participantMaterials: string;
        professionalDocumentation: {
            handouts: string[];
            facilitatorGuide?: string | undefined;
            participantWorkbook?: string | undefined;
            slideDeck?: string | undefined;
        };
        generationMetadata: {
            modelUsed: "gpt-5" | "gpt-3.5-turbo";
            generationTime: Date;
            costUsd: number;
            tokenCount: number;
            version: string;
        };
        accessibilityFeatures: {
            type: "alt_text" | "captions" | "transcript" | "keyboard_nav" | "screen_reader";
            description: string;
            implemented: boolean;
        }[];
    }, {
        learningObjectives: string[];
        activities: {
            type: "presentation" | "discussion" | "exercise" | "case_study" | "role_play";
            id: string;
            title: string;
            description: string;
            duration: number;
            materials: string[];
            instructions: string;
        }[];
        assessments: {
            type: "quiz" | "assignment" | "practical" | "peer_review";
            id: string;
            title: string;
            description: string;
            criteria: string[];
            passingScore?: number | undefined;
        }[];
        instructorNotes: string;
        participantMaterials: string;
        professionalDocumentation: {
            handouts: string[];
            facilitatorGuide?: string | undefined;
            participantWorkbook?: string | undefined;
            slideDeck?: string | undefined;
        };
        generationMetadata: {
            modelUsed: "gpt-5" | "gpt-3.5-turbo";
            generationTime: Date;
            costUsd: number;
            tokenCount: number;
            version: string;
        };
        accessibilityFeatures: {
            type: "alt_text" | "captions" | "transcript" | "keyboard_nav" | "screen_reader";
            description: string;
            implemented: boolean;
        }[];
    }>>;
    status: z.ZodEnum<["draft", "generating", "generated", "reviewed", "approved"]>;
    estimatedDuration: z.ZodNumber;
    deliveryFormat: z.ZodEnum<["instructor_led", "self_paced", "hybrid", "virtual_classroom"]>;
    accessibilityCompliance: z.ZodObject<{
        complianceLevel: z.ZodEnum<["A", "AA", "AAA"]>;
        overallScore: z.ZodNumber;
        violations: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
            guideline: z.ZodString;
            description: z.ZodString;
            location: z.ZodString;
            remediation: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            description: string;
            severity: "low" | "medium" | "high" | "critical";
            guideline: string;
            location: string;
            remediation: string;
        }, {
            id: string;
            description: string;
            severity: "low" | "medium" | "high" | "critical";
            guideline: string;
            location: string;
            remediation: string;
        }>, "many">;
        recommendations: z.ZodArray<z.ZodString, "many">;
        auditTrail: z.ZodArray<z.ZodObject<{
            timestamp: z.ZodDate;
            action: z.ZodString;
            userId: z.ZodString;
            details: z.ZodRecord<z.ZodString, z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            timestamp: Date;
            action: string;
            userId: string;
            details: Record<string, any>;
        }, {
            timestamp: Date;
            action: string;
            userId: string;
            details: Record<string, any>;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        complianceLevel: "AA" | "AAA" | "A";
        overallScore: number;
        violations: {
            id: string;
            description: string;
            severity: "low" | "medium" | "high" | "critical";
            guideline: string;
            location: string;
            remediation: string;
        }[];
        recommendations: string[];
        auditTrail: {
            timestamp: Date;
            action: string;
            userId: string;
            details: Record<string, any>;
        }[];
    }, {
        complianceLevel: "AA" | "AAA" | "A";
        overallScore: number;
        violations: {
            id: string;
            description: string;
            severity: "low" | "medium" | "high" | "critical";
            guideline: string;
            location: string;
            remediation: string;
        }[];
        recommendations: string[];
        auditTrail: {
            timestamp: Date;
            action: string;
            userId: string;
            details: Record<string, any>;
        }[];
    }>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "generating" | "generated" | "reviewed" | "approved";
    id: string;
    createdAt: Date;
    title: string;
    description: string;
    estimatedDuration: number;
    updatedAt: Date;
    topics: {
        id: string;
        content: string;
        classification: "facts" | "concepts" | "processes" | "procedures" | "principles";
        aiAnalysis: {
            contentType: string;
            rationale: string;
            recommendedMethods: string[];
            confidence: number;
            modelUsed: "gpt-5" | "gpt-3.5-turbo";
        };
        generatedAt: Date;
    }[];
    projectId: string;
    deliveryFormat: "instructor_led" | "self_paced" | "hybrid" | "virtual_classroom";
    accessibilityCompliance: {
        complianceLevel: "AA" | "AAA" | "A";
        overallScore: number;
        violations: {
            id: string;
            description: string;
            severity: "low" | "medium" | "high" | "critical";
            guideline: string;
            location: string;
            remediation: string;
        }[];
        recommendations: string[];
        auditTrail: {
            timestamp: Date;
            action: string;
            userId: string;
            details: Record<string, any>;
        }[];
    };
    generatedContent?: {
        learningObjectives: string[];
        activities: {
            type: "presentation" | "discussion" | "exercise" | "case_study" | "role_play";
            id: string;
            title: string;
            description: string;
            duration: number;
            materials: string[];
            instructions: string;
        }[];
        assessments: {
            type: "quiz" | "assignment" | "practical" | "peer_review";
            id: string;
            title: string;
            description: string;
            criteria: string[];
            passingScore?: number | undefined;
        }[];
        instructorNotes: string;
        participantMaterials: string;
        professionalDocumentation: {
            handouts: string[];
            facilitatorGuide?: string | undefined;
            participantWorkbook?: string | undefined;
            slideDeck?: string | undefined;
        };
        generationMetadata: {
            modelUsed: "gpt-5" | "gpt-3.5-turbo";
            generationTime: Date;
            costUsd: number;
            tokenCount: number;
            version: string;
        };
        accessibilityFeatures: {
            type: "alt_text" | "captions" | "transcript" | "keyboard_nav" | "screen_reader";
            description: string;
            implemented: boolean;
        }[];
    } | undefined;
}, {
    status: "draft" | "generating" | "generated" | "reviewed" | "approved";
    id: string;
    createdAt: Date;
    title: string;
    description: string;
    estimatedDuration: number;
    updatedAt: Date;
    topics: {
        id: string;
        content: string;
        classification: "facts" | "concepts" | "processes" | "procedures" | "principles";
        aiAnalysis: {
            contentType: string;
            rationale: string;
            recommendedMethods: string[];
            confidence: number;
            modelUsed: "gpt-5" | "gpt-3.5-turbo";
        };
        generatedAt: Date;
    }[];
    projectId: string;
    deliveryFormat: "instructor_led" | "self_paced" | "hybrid" | "virtual_classroom";
    accessibilityCompliance: {
        complianceLevel: "AA" | "AAA" | "A";
        overallScore: number;
        violations: {
            id: string;
            description: string;
            severity: "low" | "medium" | "high" | "critical";
            guideline: string;
            location: string;
            remediation: string;
        }[];
        recommendations: string[];
        auditTrail: {
            timestamp: Date;
            action: string;
            userId: string;
            details: Record<string, any>;
        }[];
    };
    generatedContent?: {
        learningObjectives: string[];
        activities: {
            type: "presentation" | "discussion" | "exercise" | "case_study" | "role_play";
            id: string;
            title: string;
            description: string;
            duration: number;
            materials: string[];
            instructions: string;
        }[];
        assessments: {
            type: "quiz" | "assignment" | "practical" | "peer_review";
            id: string;
            title: string;
            description: string;
            criteria: string[];
            passingScore?: number | undefined;
        }[];
        instructorNotes: string;
        participantMaterials: string;
        professionalDocumentation: {
            handouts: string[];
            facilitatorGuide?: string | undefined;
            participantWorkbook?: string | undefined;
            slideDeck?: string | undefined;
        };
        generationMetadata: {
            modelUsed: "gpt-5" | "gpt-3.5-turbo";
            generationTime: Date;
            costUsd: number;
            tokenCount: number;
            version: string;
        };
        accessibilityFeatures: {
            type: "alt_text" | "captions" | "transcript" | "keyboard_nav" | "screen_reader";
            description: string;
            implemented: boolean;
        }[];
    } | undefined;
}>;
export declare const createProjectSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    targetAudience: z.ZodString;
    estimatedDuration: z.ZodNumber;
    settings: z.ZodOptional<z.ZodObject<{
        brandingOptions: z.ZodObject<{
            primaryColor: z.ZodOptional<z.ZodString>;
            logoUrl: z.ZodOptional<z.ZodString>;
            organizationName: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        }, {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        }>;
        defaultAccessibilityLevel: z.ZodEnum<["AA", "AAA"]>;
        approvalWorkflow: z.ZodBoolean;
        stakeholderAccess: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        brandingOptions: {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        };
        defaultAccessibilityLevel: "AA" | "AAA";
        approvalWorkflow: boolean;
        stakeholderAccess: boolean;
    }, {
        brandingOptions: {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        };
        defaultAccessibilityLevel: "AA" | "AAA";
        approvalWorkflow: boolean;
        stakeholderAccess: boolean;
    }>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    targetAudience: string;
    estimatedDuration: number;
    settings?: {
        brandingOptions: {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        };
        defaultAccessibilityLevel: "AA" | "AAA";
        approvalWorkflow: boolean;
        stakeholderAccess: boolean;
    } | undefined;
}, {
    title: string;
    targetAudience: string;
    estimatedDuration: number;
    description?: string | undefined;
    settings?: {
        brandingOptions: {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        };
        defaultAccessibilityLevel: "AA" | "AAA";
        approvalWorkflow: boolean;
        stakeholderAccess: boolean;
    } | undefined;
}>;
export declare const updateProjectSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    targetAudience: z.ZodOptional<z.ZodString>;
    estimatedDuration: z.ZodOptional<z.ZodNumber>;
    settings: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        brandingOptions: z.ZodObject<{
            primaryColor: z.ZodOptional<z.ZodString>;
            logoUrl: z.ZodOptional<z.ZodString>;
            organizationName: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        }, {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        }>;
        defaultAccessibilityLevel: z.ZodEnum<["AA", "AAA"]>;
        approvalWorkflow: z.ZodBoolean;
        stakeholderAccess: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        brandingOptions: {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        };
        defaultAccessibilityLevel: "AA" | "AAA";
        approvalWorkflow: boolean;
        stakeholderAccess: boolean;
    }, {
        brandingOptions: {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        };
        defaultAccessibilityLevel: "AA" | "AAA";
        approvalWorkflow: boolean;
        stakeholderAccess: boolean;
    }>>>;
} & {
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    title?: string | undefined;
    description?: string | undefined;
    targetAudience?: string | undefined;
    estimatedDuration?: number | undefined;
    settings?: {
        brandingOptions: {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        };
        defaultAccessibilityLevel: "AA" | "AAA";
        approvalWorkflow: boolean;
        stakeholderAccess: boolean;
    } | undefined;
}, {
    id: string;
    title?: string | undefined;
    description?: string | undefined;
    targetAudience?: string | undefined;
    estimatedDuration?: number | undefined;
    settings?: {
        brandingOptions: {
            primaryColor?: string | undefined;
            logoUrl?: string | undefined;
            organizationName?: string | undefined;
        };
        defaultAccessibilityLevel: "AA" | "AAA";
        approvalWorkflow: boolean;
        stakeholderAccess: boolean;
    } | undefined;
}>;
export declare const createLessonSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    projectId: z.ZodString;
    estimatedDuration: z.ZodNumber;
    deliveryFormat: z.ZodEnum<["instructor_led", "self_paced", "hybrid", "virtual_classroom"]>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    estimatedDuration: number;
    projectId: string;
    deliveryFormat: "instructor_led" | "self_paced" | "hybrid" | "virtual_classroom";
}, {
    title: string;
    estimatedDuration: number;
    projectId: string;
    deliveryFormat: "instructor_led" | "self_paced" | "hybrid" | "virtual_classroom";
    description?: string | undefined;
}>;
export declare const updateLessonSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    projectId: z.ZodOptional<z.ZodString>;
    estimatedDuration: z.ZodOptional<z.ZodNumber>;
    deliveryFormat: z.ZodOptional<z.ZodEnum<["instructor_led", "self_paced", "hybrid", "virtual_classroom"]>>;
} & {
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    title?: string | undefined;
    description?: string | undefined;
    estimatedDuration?: number | undefined;
    projectId?: string | undefined;
    deliveryFormat?: "instructor_led" | "self_paced" | "hybrid" | "virtual_classroom" | undefined;
}, {
    id: string;
    title?: string | undefined;
    description?: string | undefined;
    estimatedDuration?: number | undefined;
    projectId?: string | undefined;
    deliveryFormat?: "instructor_led" | "self_paced" | "hybrid" | "virtual_classroom" | undefined;
}>;
export declare const lessonSequenceUpdateSchema: z.ZodObject<{
    projectId: z.ZodString;
    lessonSequence: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    projectId: string;
    lessonSequence: string[];
}, {
    projectId: string;
    lessonSequence: string[];
}>;
export declare const bulkLessonSequenceUpdateSchema: z.ZodObject<{
    projectId: z.ZodString;
    lessonSequence: z.ZodArray<z.ZodString, "many">;
    selectedLessons: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    projectId: string;
    lessonSequence: string[];
    selectedLessons: string[];
}, {
    projectId: string;
    lessonSequence: string[];
    selectedLessons: string[];
}>;
export declare const healthCheckResponseSchema: z.ZodObject<{
    status: z.ZodEnum<["healthy", "degraded", "unhealthy"]>;
    uptime: z.ZodNumber;
    version: z.ZodString;
    timestamp: z.ZodDate;
    database: z.ZodObject<{
        connected: z.ZodBoolean;
        responseTimeMs: z.ZodNumber;
        activeConnections: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        connected: boolean;
        responseTimeMs: number;
        activeConnections: number;
    }, {
        connected: boolean;
        responseTimeMs: number;
        activeConnections: number;
    }>;
    memory: z.ZodObject<{
        used: z.ZodNumber;
        total: z.ZodNumber;
        percentage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        used: number;
        total: number;
        percentage: number;
    }, {
        used: number;
        total: number;
        percentage: number;
    }>;
    performance: z.ZodObject<{
        avgResponseTimeMs: z.ZodNumber;
        activeUsers: z.ZodNumber;
        requestsPerMinute: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        avgResponseTimeMs: number;
        activeUsers: number;
        requestsPerMinute: number;
    }, {
        avgResponseTimeMs: number;
        activeUsers: number;
        requestsPerMinute: number;
    }>;
}, "strip", z.ZodTypeAny, {
    status: "healthy" | "degraded" | "unhealthy";
    version: string;
    timestamp: Date;
    uptime: number;
    database: {
        connected: boolean;
        responseTimeMs: number;
        activeConnections: number;
    };
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    performance: {
        avgResponseTimeMs: number;
        activeUsers: number;
        requestsPerMinute: number;
    };
}, {
    status: "healthy" | "degraded" | "unhealthy";
    version: string;
    timestamp: Date;
    uptime: number;
    database: {
        connected: boolean;
        responseTimeMs: number;
        activeConnections: number;
    };
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    performance: {
        avgResponseTimeMs: number;
        activeUsers: number;
        requestsPerMinute: number;
    };
}>;
export declare const apiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    timestamp: Date;
    success: boolean;
    data?: any;
    error?: string | undefined;
}, {
    timestamp: Date;
    success: boolean;
    data?: any;
    error?: string | undefined;
}>;
export declare const apiErrorResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    timestamp: Date;
    success: false;
    error: string;
    code?: string | undefined;
}, {
    timestamp: Date;
    success: false;
    error: string;
    code?: string | undefined;
}>;
export declare const signUpSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    organization: z.ZodOptional<z.ZodString>;
    role: z.ZodDefault<z.ZodEnum<["designer", "manager", "admin"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    role: "designer" | "manager" | "admin";
    password: string;
    organization?: string | undefined;
}, {
    email: string;
    name: string;
    password: string;
    organization?: string | undefined;
    role?: "designer" | "manager" | "admin" | undefined;
}>;
export declare const signInSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    organization: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["designer", "manager", "admin"]>>;
    preferences: z.ZodOptional<z.ZodObject<{
        defaultAudience: z.ZodOptional<z.ZodString>;
        preferredComplexity: z.ZodOptional<z.ZodEnum<["beginner", "intermediate", "advanced"]>>;
        accessibilityStrictness: z.ZodOptional<z.ZodEnum<["standard", "strict"]>>;
        aiGenerationStyle: z.ZodOptional<z.ZodEnum<["concise", "detailed", "comprehensive"]>>;
    }, "strip", z.ZodTypeAny, {
        defaultAudience?: string | undefined;
        preferredComplexity?: "beginner" | "intermediate" | "advanced" | undefined;
        accessibilityStrictness?: "standard" | "strict" | undefined;
        aiGenerationStyle?: "concise" | "detailed" | "comprehensive" | undefined;
    }, {
        defaultAudience?: string | undefined;
        preferredComplexity?: "beginner" | "intermediate" | "advanced" | undefined;
        accessibilityStrictness?: "standard" | "strict" | undefined;
        aiGenerationStyle?: "concise" | "detailed" | "comprehensive" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    organization?: string | undefined;
    role?: "designer" | "manager" | "admin" | undefined;
    preferences?: {
        defaultAudience?: string | undefined;
        preferredComplexity?: "beginner" | "intermediate" | "advanced" | undefined;
        accessibilityStrictness?: "standard" | "strict" | undefined;
        aiGenerationStyle?: "concise" | "detailed" | "comprehensive" | undefined;
    } | undefined;
}, {
    name?: string | undefined;
    organization?: string | undefined;
    role?: "designer" | "manager" | "admin" | undefined;
    preferences?: {
        defaultAudience?: string | undefined;
        preferredComplexity?: "beginner" | "intermediate" | "advanced" | undefined;
        accessibilityStrictness?: "standard" | "strict" | undefined;
        aiGenerationStyle?: "concise" | "detailed" | "comprehensive" | undefined;
    } | undefined;
}>;
export declare const authResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        name: z.ZodString;
        organization: z.ZodOptional<z.ZodString>;
        role: z.ZodEnum<["designer", "manager", "admin"]>;
        preferences: z.ZodObject<{
            defaultAudience: z.ZodString;
            preferredComplexity: z.ZodEnum<["beginner", "intermediate", "advanced"]>;
            accessibilityStrictness: z.ZodEnum<["standard", "strict"]>;
            aiGenerationStyle: z.ZodEnum<["concise", "detailed", "comprehensive"]>;
        }, "strip", z.ZodTypeAny, {
            defaultAudience: string;
            preferredComplexity: "beginner" | "intermediate" | "advanced";
            accessibilityStrictness: "standard" | "strict";
            aiGenerationStyle: "concise" | "detailed" | "comprehensive";
        }, {
            defaultAudience: string;
            preferredComplexity: "beginner" | "intermediate" | "advanced";
            accessibilityStrictness: "standard" | "strict";
            aiGenerationStyle: "concise" | "detailed" | "comprehensive";
        }>;
        createdAt: z.ZodDate;
        lastLoginAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        email: string;
        name: string;
        role: "designer" | "manager" | "admin";
        preferences: {
            defaultAudience: string;
            preferredComplexity: "beginner" | "intermediate" | "advanced";
            accessibilityStrictness: "standard" | "strict";
            aiGenerationStyle: "concise" | "detailed" | "comprehensive";
        };
        createdAt: Date;
        organization?: string | undefined;
        lastLoginAt?: Date | undefined;
    }, {
        id: string;
        email: string;
        name: string;
        role: "designer" | "manager" | "admin";
        preferences: {
            defaultAudience: string;
            preferredComplexity: "beginner" | "intermediate" | "advanced";
            accessibilityStrictness: "standard" | "strict";
            aiGenerationStyle: "concise" | "detailed" | "comprehensive";
        };
        createdAt: Date;
        organization?: string | undefined;
        lastLoginAt?: Date | undefined;
    }>;
    session: z.ZodOptional<z.ZodAny>;
    emailConfirmationRequired: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    user: {
        id: string;
        email: string;
        name: string;
        role: "designer" | "manager" | "admin";
        preferences: {
            defaultAudience: string;
            preferredComplexity: "beginner" | "intermediate" | "advanced";
            accessibilityStrictness: "standard" | "strict";
            aiGenerationStyle: "concise" | "detailed" | "comprehensive";
        };
        createdAt: Date;
        organization?: string | undefined;
        lastLoginAt?: Date | undefined;
    };
    session?: any;
    emailConfirmationRequired?: boolean | undefined;
}, {
    user: {
        id: string;
        email: string;
        name: string;
        role: "designer" | "manager" | "admin";
        preferences: {
            defaultAudience: string;
            preferredComplexity: "beginner" | "intermediate" | "advanced";
            accessibilityStrictness: "standard" | "strict";
            aiGenerationStyle: "concise" | "detailed" | "comprehensive";
        };
        createdAt: Date;
        organization?: string | undefined;
        lastLoginAt?: Date | undefined;
    };
    session?: any;
    emailConfirmationRequired?: boolean | undefined;
}>;
export declare const authStateSchema: z.ZodObject<{
    user: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        name: z.ZodString;
        organization: z.ZodOptional<z.ZodString>;
        role: z.ZodEnum<["designer", "manager", "admin"]>;
        preferences: z.ZodObject<{
            defaultAudience: z.ZodString;
            preferredComplexity: z.ZodEnum<["beginner", "intermediate", "advanced"]>;
            accessibilityStrictness: z.ZodEnum<["standard", "strict"]>;
            aiGenerationStyle: z.ZodEnum<["concise", "detailed", "comprehensive"]>;
        }, "strip", z.ZodTypeAny, {
            defaultAudience: string;
            preferredComplexity: "beginner" | "intermediate" | "advanced";
            accessibilityStrictness: "standard" | "strict";
            aiGenerationStyle: "concise" | "detailed" | "comprehensive";
        }, {
            defaultAudience: string;
            preferredComplexity: "beginner" | "intermediate" | "advanced";
            accessibilityStrictness: "standard" | "strict";
            aiGenerationStyle: "concise" | "detailed" | "comprehensive";
        }>;
        createdAt: z.ZodDate;
        lastLoginAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        email: string;
        name: string;
        role: "designer" | "manager" | "admin";
        preferences: {
            defaultAudience: string;
            preferredComplexity: "beginner" | "intermediate" | "advanced";
            accessibilityStrictness: "standard" | "strict";
            aiGenerationStyle: "concise" | "detailed" | "comprehensive";
        };
        createdAt: Date;
        organization?: string | undefined;
        lastLoginAt?: Date | undefined;
    }, {
        id: string;
        email: string;
        name: string;
        role: "designer" | "manager" | "admin";
        preferences: {
            defaultAudience: string;
            preferredComplexity: "beginner" | "intermediate" | "advanced";
            accessibilityStrictness: "standard" | "strict";
            aiGenerationStyle: "concise" | "detailed" | "comprehensive";
        };
        createdAt: Date;
        organization?: string | undefined;
        lastLoginAt?: Date | undefined;
    }>>;
    isAuthenticated: z.ZodBoolean;
    isLoading: z.ZodBoolean;
    error: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    error: string | null;
    user: {
        id: string;
        email: string;
        name: string;
        role: "designer" | "manager" | "admin";
        preferences: {
            defaultAudience: string;
            preferredComplexity: "beginner" | "intermediate" | "advanced";
            accessibilityStrictness: "standard" | "strict";
            aiGenerationStyle: "concise" | "detailed" | "comprehensive";
        };
        createdAt: Date;
        organization?: string | undefined;
        lastLoginAt?: Date | undefined;
    } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}, {
    error: string | null;
    user: {
        id: string;
        email: string;
        name: string;
        role: "designer" | "manager" | "admin";
        preferences: {
            defaultAudience: string;
            preferredComplexity: "beginner" | "intermediate" | "advanced";
            accessibilityStrictness: "standard" | "strict";
            aiGenerationStyle: "concise" | "detailed" | "comprehensive";
        };
        createdAt: Date;
        organization?: string | undefined;
        lastLoginAt?: Date | undefined;
    } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}>;
export declare const aiUsageLogSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    lessonId: z.ZodOptional<z.ZodString>;
    modelUsed: z.ZodEnum<["gpt-5", "gpt-3.5-turbo"]>;
    operationType: z.ZodString;
    inputTokens: z.ZodNumber;
    outputTokens: z.ZodNumber;
    costUsd: z.ZodNumber;
    processingTimeMs: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    modelUsed: "gpt-5" | "gpt-3.5-turbo";
    costUsd: number;
    userId: string;
    operationType: string;
    inputTokens: number;
    outputTokens: number;
    lessonId?: string | undefined;
    processingTimeMs?: number | undefined;
}, {
    id: string;
    createdAt: Date;
    modelUsed: "gpt-5" | "gpt-3.5-turbo";
    costUsd: number;
    userId: string;
    operationType: string;
    inputTokens: number;
    outputTokens: number;
    lessonId?: string | undefined;
    processingTimeMs?: number | undefined;
}>;
//# sourceMappingURL=index.d.ts.map