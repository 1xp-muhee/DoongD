# DoongD Data Schema

> 상태: v0.1
> 목적: 개발 시작용 데이터 스키마 초안

---

## 1. 핵심 데이터 단위
- CharacterData
- NamedCharacterData
- EnemyData
- RoomData
- FacilityData
- TrapData
- BattleWaveData
- StoryEventData
- RelationshipRouteData
- SecretaryData
- InheritanceRuleData
- ResourceData
- LocationVariantData

## 2. CharacterData 예시 필드
- id
- name
- rarity
- class
- hp / atk / def / speed
- traits[]
- skills[]
- upgradePath
- captureValue

### MVP 우선 구현 필드만 추리면
- id
- name
- class
- hp
- atk
- def
- speed
- skillIds[]
- roomPreferenceTag
- cost

## 3. FacilityData 예시 필드
- id
- name
- category
- cost
- unlockCondition
- revenueType
- riskType
- roomTag

## 4. StoryEventData 예시 필드
- id
- chapter
- triggerCondition
- involvedCharacters[]
- routeTags[]
- results[]

## 5. SecretaryData 예시 필드
- id
- name
- archetype
- bonuses[]
- growthBranches[]
- unlockCondition
