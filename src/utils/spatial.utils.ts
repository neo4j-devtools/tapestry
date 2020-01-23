import Num from '../monads/primitive/num/num.monad';

export function formatAsFloat(number: Num): string {
    return number.isInteger ? `${number}.0` : `${number}`;
}
