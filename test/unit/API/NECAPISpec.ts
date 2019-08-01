import { ISchedule, parseGetSchedulesOutput } from '../../../src/API/NECAPI';

describe('API.NECAPI', function () {

	describe('parseGetSchedulesOutput', function () {

		it('should correctly parse output of getSchedules', function () {
			const rawOutput =
				"1,1,8,30,4\n" +
				"2,2,22,0,4\n" +
				"3,1,10,0,14";

			const expectedSchedules: ISchedule[] = [
				{
					index: 1,
					event: 1,
					hour: 8,
					minute: 30,
					days: 4,
				},
				{
					index: 2,
					event: 2,
					hour: 22,
					minute: 0,
					days: 4,
				},
				{
					index: 3,
					event: 1,
					hour: 10,
					minute: 0,
					days: 14,
				},
			];

			const actualSchedules = parseGetSchedulesOutput(rawOutput);
			actualSchedules.should.deepEqual(expectedSchedules);
		});
	});
});
