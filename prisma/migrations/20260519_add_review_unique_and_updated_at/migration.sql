-- CreateIndex: 1인 1리뷰 유니크 제약
CREATE UNIQUE INDEX "Review_userId_restaurantId_key" ON "Review"("userId", "restaurantId");
