# Стратегия интервального повторения по кривой забывания Эббингауза

Кривая забывания Эббингауза показывает, что без повторов уже в первые 20–60 минут после изучения память теряет значительную часть информации, а затем скорость забывания выравнивается к концу суток. Интервальное повторение с нарастающими интервалами «сбрасывает» эту кривую и укрепляет материал в долговременной памяти. Эффективный алгоритм повторений строится так, чтобы повторять содержимое как раз до того момента, когда воспоминание ослабевает. Например, рекомендуют первую репетицию примерно через 20–30 минут после урока, затем через 1 день, через 2–3 недели и через 2–3 месяца. При этом для оптимизации времени повторения выбираются **20% наиболее показательных** предложений (по принципу Парето) – самых частотных, ярких или проблемных, достаточных для удержания ~80% материала.

---

## Расписание повторений

Примерный график интервальных повторений для одного выученного предложения:

| № повторения | Интервал (дней после урока) | Комментарий                                |
|:------------:|:----------------------------:|:-------------------------------------------|
| 1-е          | 0                            | сразу после изучения (в уроке)             |
| 2-е          | 1                            | через 1 день                               |
| 3-е          | 3                            | через 3 дня                                |
| 4-е          | 7                            | через неделю                               |
| 5-е          | 14                           | через 2 недели                             |
| 6-е          | 30                           | через 1 месяц                              |
| 7-е          | 60                           | через 2 месяца                             |
| 8-е          | 120                          | через 4 месяца (если нужно закрепление)    |

---

## Динамика нагрузки по мере прогресса

Каждый день пользователь учит 1 урок ≈ 100 предложений → в повторение идут ~20 предложений (20%). Ниже пример, как меняется нагрузка:

| День курса | Новых предложений | Повторяемых предложений | Всего повторений |
|:----------:|:-----------------:|:------------------------:|:----------------:|
| 1          | 20                | 0                        | 20               |
| 2          | 20                | 20                       | 40               |
| 4          | 20                | 40                       | 60               |
| 8          | 20                | 60                       | 80               |
| 15         | 20                | 80                       | 100              |
| 30         | 20                | 100                      | 120              |
| 100        | 20                | 100                      | 120              |
| 300        | 20                | 100                      | 120              |

> Пример: К 30-му дню курс выходит на стабильный уровень ≈120 предложений в день (новые + повторы). Это соответствует 1 часу ежедневной практики.

---

## Приоритизация предложений

Из каждого урока выбирается ~20% предложений. Критерии:

- **Частотность**: общие фразы, конструкции, часто встречаемые слова.
- **Ошибки**: предложения, в которых были ошибки, повторяются чаще.
- **Ключевые конструкции**: предложения, иллюстрирующие главную тему урока.

Дополнительно можно использовать адаптивную приоритизацию: если пользователь ошибается в предложении → оно получает более короткий интервал и более высокий приоритет.
