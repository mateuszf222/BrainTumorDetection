const getIntersection = <T>(array1: T[], array2: T[]): T[] => {
    const lookupSet = new Set(array2);
    return array1.filter(element => lookupSet.has(element));
};

interface Session {
    roles?: number[];
}

const common = {
    methods: {
        checkIfInRole(session: Session, roles: number[]): boolean {
            const intersection = getIntersection(session.roles || [], roles || []);
            return intersection.length > 0;
        }
    }
};

export default common;
