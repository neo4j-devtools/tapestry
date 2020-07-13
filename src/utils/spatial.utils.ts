import CypherNum from '../monads/cypher-num/cypher-num.monad';

export function formatAsFloat(number: CypherNum): string {
    return number.isInteger ? `${number}.0` : `${number}`;
}
